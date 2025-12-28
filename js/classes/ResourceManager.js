/**
 * Gerenciador genérico de recursos (sprites, áudios, imagens)
 */
class ResourceManager {
  constructor(resourcesConfig) {
    this.config = resourcesConfig;
    this.resources = {
      sprites: {},
      audio: {},
      images: {}
    };
    this.loadPromises = {};
  }

  /**
   * Carrega todos os recursos de um tipo específico
   * @param {string} type - Tipo de recurso: 'sprites', 'audio', 'images'
   * @returns {Promise} Promise que resolve quando todos os recursos do tipo são carregados
   */
  loadType(type) {
    if (!this.config[type]) {
      return Promise.resolve();
    }

    const promises = Object.keys(this.config[type]).map(key => {
      return this.loadResource(type, key);
    });

    return Promise.all(promises);
  }

  /**
   * Carrega todos os recursos
   * @returns {Promise} Promise que resolve quando todos os recursos são carregados
   */
  loadAll() {
    const promises = [
      this.loadType('sprites'),
      this.loadType('audio'),
      this.loadType('images')
    ];

    return Promise.all(promises);
  }

  /**
   * Carrega um recurso específico
   * @param {string} type - Tipo de recurso: 'sprites', 'audio', 'images'
   * @param {string} key - Chave do recurso no config
   * @returns {Promise} Promise que resolve quando o recurso é carregado
   */
  loadResource(type, key) {
    const resourceKey = `${type}.${key}`;
    
    // Se já está carregando ou carregado, retorna a promise existente
    if (this.loadPromises[resourceKey]) {
      return this.loadPromises[resourceKey];
    }

    const config = this.config[type][key];
    if (!config) {
      return Promise.reject(new Error(`Recurso ${resourceKey} não encontrado no config`));
    }

    let promise;

    switch (config.type) {
      case 'spriteSheet':
        promise = this.#loadSpriteSheet(key, config);
        break;
      case 'sound':
      case 'music':
        promise = this.#loadAudio(key, config);
        break;
      case 'image':
        promise = this.#loadImage(key, config);
        break;
      default:
        promise = Promise.reject(new Error(`Tipo de recurso desconhecido: ${config.type}`));
    }

    this.loadPromises[resourceKey] = promise;
    return promise;
  }

  /**
   * Carrega um sprite sheet
   * @private
   */
  #loadSpriteSheet(key, config) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.resources.sprites[key] = {
          image: img,
          config: config,
          loaded: true
        };
        resolve(this.resources.sprites[key]);
      };
      img.onerror = () => {
        reject(new Error(`Falha ao carregar sprite sheet: ${config.path}`));
      };
      img.src = config.path;
    });
  }

  /**
   * Carrega um arquivo de áudio
   * @private
   */
  #loadAudio(key, config) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = config.volume || 1.0;
      audio.loop = config.loop || false;

      audio.addEventListener('canplaythrough', () => {
        this.resources.audio[key] = {
          audio: audio,
          config: config,
          loaded: true
        };
        resolve(this.resources.audio[key]);
      }, { once: true });

      audio.addEventListener('error', () => {
        reject(new Error(`Falha ao carregar áudio: ${config.path}`));
      }, { once: true });

      audio.src = config.path;
      audio.load();
    });
  }

  /**
   * Carrega uma imagem
   * @private
   */
  #loadImage(key, config) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.resources.images[key] = {
          image: img,
          config: config,
          loaded: true
        };
        resolve(this.resources.images[key]);
      };
      img.onerror = () => {
        reject(new Error(`Falha ao carregar imagem: ${config.path}`));
      };
      img.src = config.path;
    });
  }

  /**
   * Obtém um recurso carregado
   * @param {string} type - Tipo de recurso: 'sprites', 'audio', 'images'
   * @param {string} key - Chave do recurso
   * @returns {Object|null} Recurso carregado ou null se não encontrado
   */
  get(type, key) {
    if (!this.resources[type] || !this.resources[type][key]) {
      return null;
    }
    return this.resources[type][key];
  }

  /**
   * Obtém a configuração de um recurso
   * @param {string} type - Tipo de recurso
   * @param {string} key - Chave do recurso
   * @returns {Object|null} Configuração do recurso ou null
   */
  getConfig(type, key) {
    if (!this.config[type] || !this.config[type][key]) {
      return null;
    }
    return this.config[type][key];
  }

  /**
   * Verifica se um recurso está carregado
   * @param {string} type - Tipo de recurso
   * @param {string} key - Chave do recurso
   * @returns {boolean}
   */
  isLoaded(type, key) {
    const resource = this.get(type, key);
    return resource && resource.loaded === true;
  }

  /**
   * Toca um som
   * @param {string} key - Chave do áudio
   * @param {Object} options - Opções (volume, loop, etc.)
   */
  playSound(key, options = {}) {
    const audioResource = this.get('audio', key);
    if (!audioResource || !audioResource.loaded) {
      console.warn(`Áudio ${key} não está carregado`);
      return;
    }

    const audio = audioResource.audio.cloneNode();
    if (options.volume !== undefined) {
      audio.volume = options.volume;
    }
    if (options.loop !== undefined) {
      audio.loop = options.loop;
    }
    audio.play().catch(err => {
      console.warn(`Erro ao tocar áudio ${key}:`, err);
    });

    return audio;
  }

  /**
   * Para um som que está tocando
   * @param {string} key - Chave do áudio
   */
  stopSound(key) {
    const audioResource = this.get('audio', key);
    if (audioResource && audioResource.audio) {
      audioResource.audio.pause();
      audioResource.audio.currentTime = 0;
    }
  }
}

