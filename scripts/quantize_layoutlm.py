#!/usr/bin/env python
# scripts/quantize_layoutlm.py

import os
import argparse
import torch
from transformers import LayoutLMModel, LayoutLMConfig
from optimum.onnxruntime import ORTQuantizer
from optimum.onnxruntime.configuration import AutoQuantizationConfig
import onnx

def parse_args():
    parser = argparse.ArgumentParser(description="Quantification du modèle LayoutLM pour déploiement Edge")
    parser.add_argument(
        "--input_model",
        type=str,
        default="microsoft/layoutlm-base-uncased",
        help="Modèle LayoutLM à quantifier (chemin local ou huggingface model id)"
    )
    parser.add_argument(
        "--output_model",
        type=str,
        required=True,
        help="Chemin de sortie pour le modèle quantifié (.onnx)"
    )
    parser.add_argument(
        "--quantize",
        type=str,
        choices=["int8", "int4", "fp16", "none"],
        default="int8",
        help="Type de quantification à appliquer"
    )
    return parser.parse_args()

def main():
    args = parse_args()
    
    print(f"Chargement du modèle LayoutLM: {args.input_model}")
    
    # Créer le dossier de sortie si nécessaire
    output_dir = os.path.dirname(args.output_model)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 1. Charger le modèle LayoutLM
    model = LayoutLMModel.from_pretrained(args.input_model)
    config = LayoutLMConfig.from_pretrained(args.input_model)
    
    # 2. Convertir d'abord en ONNX pour optimisation ultérieure
    input_names = ["input_ids", "attention_mask", "token_type_ids", "bbox"]
    onnx_path = args.output_model if args.quantize == "none" else args.output_model.replace(".onnx", "_base.onnx")
    
    # Définir les entrées d'exemple
    dummy_inputs = {
        "input_ids": torch.ones(1, 512, dtype=torch.long),
        "attention_mask": torch.ones(1, 512, dtype=torch.long),
        "token_type_ids": torch.zeros(1, 512, dtype=torch.long),
        "bbox": torch.zeros(1, 512, 4, dtype=torch.long)
    }
    
    print(f"Conversion en ONNX: {onnx_path}")
    
    # Exporter le modèle en ONNX
    torch.onnx.export(
        model,
        tuple(dummy_inputs.values()),
        onnx_path,
        input_names=input_names,
        output_names=["last_hidden_state"],
        dynamic_axes={
            "input_ids": {0: "batch", 1: "sequence"},
            "attention_mask": {0: "batch", 1: "sequence"},
            "token_type_ids": {0: "batch", 1: "sequence"},
            "bbox": {0: "batch", 1: "sequence"},
            "last_hidden_state": {0: "batch", 1: "sequence"}
        },
        opset_version=12
    )
    
    # 3. Quantifier le modèle si nécessaire
    if args.quantize != "none":
        print(f"Quantification du modèle en {args.quantize}")
        
        # Charger le modèle ONNX
        model_onnx = onnx.load(onnx_path)
        
        # Configurer la quantification
        if args.quantize == "int8":
            quantization_config = AutoQuantizationConfig.arm64(is_static=False, per_channel=False)
        elif args.quantize == "int4":
            quantization_config = AutoQuantizationConfig.arm64(is_static=False, per_channel=False, activation_type=onnx.TensorProto.INT4)
        elif args.quantize == "fp16":
            quantization_config = AutoQuantizationConfig.fp16()
        
        # Quantifier
        quantizer = ORTQuantizer.from_pretrained(args.input_model)
        quantizer.quantize(save_dir=output_dir, quantization_config=quantization_config)
        
        # Renommer le fichier de sortie si nécessaire
        output_file = os.path.join(output_dir, "model_quantized.onnx")
        if os.path.exists(output_file) and output_file != args.output_model:
            os.rename(output_file, args.output_model)
        
        # Nettoyer le fichier intermédiaire
        if onnx_path != args.output_model and os.path.exists(onnx_path):
            os.remove(onnx_path)
    
    model_size_mb = os.path.getsize(args.output_model) / (1024 * 1024)
    print(f"Modèle quantifié sauvegardé: {args.output_model} ({model_size_mb:.2f} MB)")
    print("Terminé!")

if __name__ == "__main__":
    main()