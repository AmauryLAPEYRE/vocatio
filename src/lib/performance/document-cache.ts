// src/lib/performance/document-cache.ts

/**
 * Service de mise en cache pour les documents et modèles
 * Évite de refaire des opérations coûteuses sur les documents
 */
export class DocumentCache {
    private static instance: DocumentCache;
    private cache: Map<string, CacheEntry>;
    private maxSize: number;
  
    // Définir un temps d'expiration pour les entrées de cache (en ms)
    private readonly EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes
  
    private constructor(maxSize = 10) {
      this.cache = new Map();
      this.maxSize = maxSize;
    }
  
    /**
     * Obtenir l'instance unique du cache (Singleton)
     */
    public static getInstance(): DocumentCache {
      if (!DocumentCache.instance) {
        DocumentCache.instance = new DocumentCache();
      }
      return DocumentCache.instance;
    }
  
    /**
     * Obtenir une entrée du cache
     * @param key Clé de l'entrée
     * @returns Valeur associée à la clé, ou undefined si non trouvée ou expirée
     */
    public get<T>(key: string): T | undefined {
      const entry = this.cache.get(key);
      
      // Vérifier si l'entrée existe et n'est pas expirée
      if (entry && Date.now() < entry.expiresAt) {
        // Mettre à jour la date d'accès
        entry.lastAccessed = Date.now();
        return entry.value as T;
      }
      
      // Entrée non trouvée ou expirée
      if (entry) {
        this.cache.delete(key);
      }
      
      return undefined;
    }
  
    /**
     * Ajouter ou mettre à jour une entrée dans le cache
     * @param key Clé de l'entrée
     * @param value Valeur à stocker
     */
    public set<T>(key: string, value: T): void {
      // Vérifier si le cache est plein
      if (this.cache.size >= this.maxSize) {
        this.evictOldest();
      }
      
      // Créer l'entrée avec date d'expiration
      const entry: CacheEntry = {
        value,
        lastAccessed: Date.now(),
        expiresAt: Date.now() + this.EXPIRATION_TIME
      };
      
      this.cache.set(key, entry);
    }
  
    /**
     * Supprimer une entrée du cache
     * @param key Clé de l'entrée à supprimer
     */
    public delete(key: string): boolean {
      return this.cache.delete(key);
    }
  
    /**
     * Vider complètement le cache
     */
    public clear(): void {
      this.cache.clear();
    }
  
    /**
     * Supprimer l'entrée la moins récemment utilisée
     */
    private evictOldest(): void {
      let oldestKey: string | null = null;
      let oldestTime = Date.now();
      
      // Trouver l'entrée la moins récemment utilisée
      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestKey = key;
          oldestTime = entry.lastAccessed;
        }
      }
      
      // Supprimer l'entrée la plus ancienne
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }
  
  // Type pour les entrées du cache
  interface CacheEntry {
    value: any;
    lastAccessed: number;
    expiresAt: number;
  }
