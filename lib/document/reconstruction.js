// lib/document/reconstruction.js

/**
 * Génère une représentation HTML/CSS fidèle du document
 * @param {Object} documentStructure - Structure du document analysé
 * @param {Object} options - Options de rendu
 * @returns {Promise<HTMLElement>} Élément HTML représentant le document
 */
export async function renderDocumentToHTML(documentStructure, options = {}) {
    const { 
      highlightChanges = false, 
      diffMode = false,
      forPrinting = false,
      scale = 1
    } = options;
    
    const { blocks, styleMap, metadata } = documentStructure;
    
    // Créer le conteneur principal avec dimensions précises
    const container = document.createElement('div');
    container.className = 'cv-document';
    container.style.position = 'relative';
    container.style.width = `${metadata.dimensions.width * scale}px`;
    container.style.height = `${metadata.dimensions.height * metadata.pageCount * scale}px`;
    container.style.fontFamily = 'sans-serif'; // Police par défaut
    
    // Style global
    const styleElement = document.createElement('style');
    styleElement.textContent = generateGlobalCSS(styleMap, {
      scale,
      highlightChanges
    });
    container.appendChild(styleElement);
    
    // Grouper les blocs par page
    const blocksByPage = {};
    blocks.forEach(block => {
      const pageNumber = block.pageNumber || 1;
      if (!blocksByPage[pageNumber]) {
        blocksByPage[pageNumber] = [];
      }
      blocksByPage[pageNumber].push(block);
    });
    
    // Créer un conteneur pour chaque page
    for (let pageNumber = 1; pageNumber <= metadata.pageCount; pageNumber++) {
      const pageBlocks = blocksByPage[pageNumber] || [];
      
      // Créer le conteneur de page
      const pageContainer = document.createElement('div');
      pageContainer.className = `page page-${pageNumber}`;
      pageContainer.style.position = 'relative';
      pageContainer.style.width = `${metadata.dimensions.width * scale}px`;
      pageContainer.style.height = `${metadata.dimensions.height * scale}px`;
      pageContainer.style.backgroundColor = 'white';
      
      if (!forPrinting) {
        pageContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        pageContainer.style.marginBottom = pageNumber < metadata.pageCount ? '20px' : '0';
      }
      
      // Créer les éléments pour chaque bloc
      pageBlocks.forEach(block => {
        const element = createBlockElement(block, scale, {
          highlightChanges,
          diffMode
        });
        pageContainer.appendChild(element);
      });
      
      container.appendChild(pageContainer);
    }
    
    return container;
  }
  
  /**
   * Crée un élément HTML correspondant à un bloc identifié
   * @param {Object} block - Bloc de document (texte, image, etc.)
   * @param {number} scale - Échelle de rendu
   * @param {Object} options - Options de rendu
   * @returns {HTMLElement} Élément HTML positionné correctement
   */
  function createBlockElement(block, scale = 1, options = {}) {
    const { highlightChanges, diffMode } = options;
    const element = document.createElement('div');
    
    // Positionnement absolu précis
    element.style.position = 'absolute';
    element.style.left = `${block.bbox.x * scale}px`;
    element.style.top = `${block.bbox.y * scale}px`;
    element.style.width = `${block.bbox.width * scale}px`;
    element.style.height = `${block.bbox.height * scale}px`;
    
    // Identifiants pour manipulation ultérieure
    element.dataset.blockId = block.id;
    element.dataset.blockType = block.type;
    element.dataset.section = block.section || '';
    element.dataset.editable = block.editable ? 'true' : 'false';
    
    // Appliquer le style spécifique au bloc
    if (block.style) {
      Object.entries(block.style).forEach(([prop, value]) => {
        // Adapter les valeurs en px à l'échelle
        if (typeof value === 'string' && value.endsWith('px')) {
          const numValue = parseFloat(value);
          element.style[prop] = `${numValue * scale}px`;
        } else {
          element.style[prop] = value;
        }
      });
    }
    
    // Appliquer les classes CSS
    if (block.cssClasses && Array.isArray(block.cssClasses)) {
      block.cssClasses.forEach(className => {
        element.classList.add(className);
      });
    }
    
    // Mise en évidence des modifications
    if (highlightChanges && block.originalText && block.text !== block.originalText) {
      const matchScore = block.matchScore || 0.5;
      
      if (diffMode) {
        // Mode différence: montrer l'avant/après
        element.classList.add('diff-block');
        renderDiffContent(element, block);
      } else {
        // Mode surbrillance: coloration selon le score
        element.classList.add('modified-block');
        element.style.backgroundColor = `rgba(52, 152, 219, ${Math.min(0.2, matchScore * 0.3)})`;
        element.style.border = '1px solid rgba(52, 152, 219, 0.5)';
      }
    }
    
    // Contenu spécifique au type de bloc
    if (block.type === 'text') {
      element.textContent = block.text || '';
      element.style.whiteSpace = 'pre-wrap';
      element.style.overflowWrap = 'break-word';
    } else if (block.type === 'image' && block.dataUrl) {
      const img = document.createElement('img');
      img.src = block.dataUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      element.appendChild(img);
    }
    
    return element;
  }
  
  /**
   * Génère le CSS global pour le document
   * @param {Object} styleMap - Carte des styles
   * @param {Object} options - Options de rendu
   * @returns {string} CSS global
   */
  function generateGlobalCSS(styleMap, options = {}) {
    const { scale, highlightChanges } = options;
    
    if (!styleMap) {
      return `
        .cv-document {
          font-family: Arial, sans-serif;
          color: #000000;
          background-color: white;
        }
      `;
    }
    
    let css = `
      @font-face {
        font-family: 'CV-Font';
        src: url('${styleMap.mainFont?.url || 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap'}');
        font-weight: normal;
        font-style: normal;
      }
      
      .cv-document {
        font-family: 'CV-Font', Arial, sans-serif;
        color: ${styleMap.mainColor || '#000000'};
      }
    `;
    
    // CSS pour les blocs modifiés
    if (highlightChanges) {
      css += `
        .modified-block {
          position: relative;
        }
        
        .diff-block {
          position: relative;
        }
        
        .diff-block::before {
          content: attr(data-original-text);
          position: absolute;
          top: -20px;
          left: 0;
          right: 0;
          background-color: rgba(255, 0, 0, 0.1);
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 0.8em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-decoration: line-through;
          color: rgba(200, 0, 0, 0.8);
          transform: scale(${1/scale});
          transform-origin: bottom left;
        }
      `;
    }
    
    // Ajouter des règles pour chaque classe CSS définie
    if (styleMap.classes) {
      Object.entries(styleMap.classes).forEach(([className, style]) => {
        css += `
          .${className} {
            ${Object.entries(style).map(([prop, value]) => {
              // Adapter les valeurs en px à l'échelle
              if (typeof value === 'string' && value.endsWith('px')) {
                const numValue = parseFloat(value);
                return `${prop}: ${numValue * scale}px;`;
              }
              return `${prop}: ${value};`;
            }).join('\n          ')}
          }
        `;
      });
    }
    
    return css;
  }
  
  /**
   * Crée un rendu des différences dans le bloc
   * @param {HTMLElement} element - Élément DOM à modifier
   * @param {Object} block - Bloc contenant texte original et optimisé
   */
  function renderDiffContent(element, block) {
    // Nettoyer l'élément
    element.innerHTML = '';
    
    // Stocker le texte original comme attribut
    element.dataset.originalText = block.originalText;
    
    // Ajouter le nouveau texte dans l'élément
    element.textContent = block.text;
    
    // Ajouter des info-bulles
    element.title = `Original: "${block.originalText}"
  Optimisé: "${block.text}"`;
  }