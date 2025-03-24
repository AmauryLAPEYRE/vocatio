// src/lib/error/error-handler.ts

export type ErrorType = 
  | 'network'         // Erreurs de connexion
  | 'api'             // Erreurs d'API
  | 'document'        // Erreurs de traitement de document
  | 'file'            // Erreurs de fichier
  | 'format'          // Erreurs de format
  | 'export'          // Erreurs d'exportation
  | 'optimization'    // Erreurs d'optimisation
  | 'auth'            // Erreurs d'authentification (si nécessaire à l'avenir)
  | 'validation'      // Erreurs de validation
  | 'unexpected';     // Erreurs inattendues

interface ErrorDetails {
  type: ErrorType;
  message: string;
  code?: string;
  context?: Record<string, any>;
  originalError?: any;
}

/**
 * Classe pour la gestion uniforme des erreurs dans l'application
 */
export class AppError extends Error {
  public type: ErrorType;
  public code?: string;
  public context?: Record<string, any>;
  public originalError?: any;
  public userMessage: string;

  constructor({ type, message, code, context, originalError }: ErrorDetails) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.context = context;
    this.originalError = originalError;
    
    // Message compréhensible pour l'utilisateur final
    this.userMessage = this.getUserFriendlyMessage();
    
    // Capturer la stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Génère un message d'erreur compréhensible pour l'utilisateur final
   */
  private getUserFriendlyMessage(): string {
    switch (this.type) {
      case 'network':
        return 'Une erreur de connexion est survenue. Veuillez vérifier votre connexion internet et réessayer.';
      
      case 'api':
        return 'Une erreur s\'est produite lors de la communication avec notre service. Veuillez réessayer dans quelques instants.';
      
      case 'document':
        return 'Une erreur s\'est produite lors du traitement de votre document. Veuillez vérifier le format et réessayer.';
      
      case 'file':
        return 'Le fichier sélectionné ne peut pas être traité. Veuillez vérifier qu\'il s\'agit d\'un PDF ou DOCX valide.';
      
      case 'format':
        return 'Le format du document n\'est pas pris en charge. Veuillez utiliser un PDF ou DOCX standard.';
      
      case 'export':
        return 'Une erreur s\'est produite lors de l\'exportation du document. Veuillez réessayer.';
      
      case 'optimization':
        return 'L\'optimisation du document a échoué. Veuillez réessayer ou essayer avec un autre document.';
      
      case 'auth':
        return 'Une erreur d\'authentification s\'est produite. Veuillez vous reconnecter.';
      
      case 'validation':
        return 'Certaines informations sont invalides. Veuillez vérifier vos entrées et réessayer.';
      
      case 'unexpected':
      default:
        return 'Une erreur inattendue s\'est produite. Veuillez réessayer ou contacter le support si le problème persiste.';
    }
  }

  /**
   * Journalise l'erreur avec des détails supplémentaires
   */
  public log(): void {
    console.error(`[${this.type.toUpperCase()}] ${this.message}`, {
      code: this.code,
      context: this.context,
      originalError: this.originalError,
      stack: this.stack
    });
    
    // Ici, on pourrait ajouter un service de journalisation externe 
    // comme Sentry, LogRocket, etc.
  }
}

/**
 * Gestionnaire global d'erreurs pour l'application
 */
export class ErrorHandler {
  /**
   * Traite une erreur potentielle et la transforme en AppError
   */
  static handle(error: any, defaultType: ErrorType = 'unexpected'): AppError {
    // Si c'est déjà un AppError, le retourner tel quel
    if (error instanceof AppError) {
      error.log();
      return error;
    }
    
    // Déterminer le type d'erreur si possible
    let type = defaultType;
    let message = 'Une erreur est survenue';
    let code: string | undefined = undefined;
    
    // Si c'est une erreur de fetch (réseau)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      type = 'network';
      message = 'Erreur de connexion au serveur';
    }
    
    // Analyser les autres types d'erreurs JavaScript natives
    else if (error instanceof TypeError) {
      message = `Erreur de type: ${error.message}`;
    }
    else if (error instanceof SyntaxError) {
      message = `Erreur de syntaxe: ${error.message}`;
    }
    else if (error instanceof RangeError) {
      message = `Erreur de plage: ${error.message}`;
    }
    
    // Pour les objets d'erreur standard
    else if (error instanceof Error) {
      message = error.message;
      // Vérifier s'il s'agit d'une erreur API avec un code HTTP
      if ('status' in error) {
        // @ts-ignore
        code = `HTTP_${error.status}`;
        type = 'api';
      }
    }
    
    // Pour les chaînes de caractères
    else if (typeof error === 'string') {
      message = error;
    }
    
    // Créer et journaliser l'AppError
    const appError = new AppError({
      type,
      message,
      code,
      originalError: error
    });
    
    appError.log();
    return appError;
  }

  /**
   * Enregistre une erreur de document
   */
  static documentError(message: string, originalError?: any, context?: Record<string, any>): AppError {
    return new AppError({
      type: 'document',
      message,
      context,
      originalError
    });
  }

  /**
   * Enregistre une erreur d'API
   */
  static apiError(message: string, code?: string, originalError?: any): AppError {
    return new AppError({
      type: 'api',
      message,
      code,
      originalError
    });
  }

  /**
   * Enregistre une erreur d'exportation
   */
  static exportError(message: string, originalError?: any): AppError {
    return new AppError({
      type: 'export',
      message,
      originalError
    });
  }
}