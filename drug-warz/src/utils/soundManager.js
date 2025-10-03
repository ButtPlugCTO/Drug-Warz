// Sound Manager for Drug Warz - Using Original Sound Files
class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.7;
    
    // Load original DopeWars sound files
    this.loadSounds();
  }

  // Load all original sound files
  loadSounds() {
    const soundFiles = {
      // Original DopeWars sound mappings from source code
      'colt': 'colt.wav',           // Sounds.FightHit - Gun hit sound
      'shotdown': 'shotdown.wav',   // Sounds.EnemyKilled, Sounds.EnemyBitchKilled - Enemy killed
      'losebitch': 'losebitch.wav', // Sounds.BitchKilled - Your ally killed
      'die': 'die.wav',             // Sounds.Killed - Player killed
      'run': 'run.wav',             // Sounds.Flee, Sounds.EnemyFlee - Fleeing
      'train': 'train.wav',         // Sounds.Jet - Travel/jet sound
      'murmur': 'murmur.wav',       // Sounds.TalkPrivate - Private chat
      'message': 'message.wav',     // Sounds.TalkToAll - Public chat
      'bye': 'bye.wav',             // Sounds.EndGame - Game end
      'gun': 'gun.wav',             // Additional gun sound
      'punch': 'punch.wav',         // Additional punch sound
      'jet': 'jet.wav'              // Additional jet sound
    };

    // Preload all sounds
    Object.entries(soundFiles).forEach(([key, filename]) => {
      this.sounds[key] = new Audio(`/sounds/${filename}`);
      this.sounds[key].volume = this.volume;
    });
  }

  // Play sound with original DopeWars mapping
  playSound(soundName) {
    if (!this.enabled) {
      console.log(`Sound disabled, skipping: ${soundName}`);
      return;
    }

    console.log(`Playing sound: ${soundName}`);

    // Map our game events to original DopeWars sounds
    const soundMap = {
      // Combat sounds - using original mappings
      'gunshot': 'colt',        // Gun hit from original
      'hit': 'colt',            // Same as gunshot in original
      'miss': 'punch',          // Use punch for miss
      'flee': 'run',            // Original flee sound
      'death': 'die',           // Original death sound
      'victory': 'shotdown',    // Enemy defeated sound
      
      // Travel and location sounds
      'travel': 'train',        // Original jet/travel sound
      'jet': 'jet',             // Alternative jet sound
      
      // Communication sounds (adapted for our events)
      'success': 'message',     // Public message for success
      'money': 'murmur',        // Private message for money events
      'heal': 'murmur',         // Private message for healing
      'nextTurn': 'murmur',     // Private message for turn advancement
      
      // Game state sounds
      'gameEnd': 'bye',         // Original game end sound
      'gameStart': 'message',   // Public message for game start
      
      // Error and warning sounds (use available sounds)
      'error': 'punch',         // Punch sound for errors
      'siren': 'shotdown',      // Use shotdown for siren (cop encounter)
      'combat': 'colt',         // Gun sound for combat start
      
      // Trading sounds (adapted)
      'buy': 'message',         // Public message for buying (cash register-like)
      'sell': 'murmur',         // Private message for selling
      'cashRegister': 'message' // Cash register sound for purchases
    };

    const originalSound = soundMap[soundName] || soundName;
    
    if (this.sounds[originalSound]) {
      // Clone and play to allow overlapping sounds
      const audio = this.sounds[originalSound].cloneNode();
      audio.volume = this.volume;
      audio.play().catch(e => {
        // Fallback to silent if audio fails to play
        console.warn(`Could not play sound: ${originalSound}`, e);
      });
    }
  }

  // Toggle sound on/off
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Get current volume
  getVolume() {
    return this.volume;
  }

  // Check if sound is enabled
  isEnabled() {
    return this.enabled;
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

export default soundManager;
