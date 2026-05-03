const btn = document.getElementById('checkBtn');
const result = document.getElementById('result');
const heartContainer = document.querySelector('.heart-container');
const ekgContainer = document.getElementById('ekg-container');
const scanLine = document.getElementById('scan-line');
const bgElements = document.getElementById('bg-elements-container');

let measureTimeout;
let hapticInterval;
let effectInterval;
let progressInterval;
let floatingInterval;
let audioCtx;

// Audio Engine
const AudioEngine = {
  init() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  },
  
  createOsc(freq, type = 'sine', duration = 0.5, volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  },

  playThump() {
    this.createOsc(60, 'sine', 0.1, 0.5);
    setTimeout(() => this.createOsc(40, 'sine', 0.1, 0.3), 150);
    // Screen Shake Impact
    document.body.classList.add('impact');
    setTimeout(() => document.body.classList.remove('impact'), 100);
  },

  playLove() {
    [261.63, 329.63, 392.00, 523.25].forEach(f => this.createOsc(f, 'sine', 1.5, 0.1));
  },

  playBroken() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
  },

  playFrozen() {
    const bufferSize = audioCtx.sampleRate * 1.5;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
  }
};

// Voice Engine
const VoiceEngine = {
  speak(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.rate = 0.9;
      msg.pitch = 1.0;
      window.speechSynthesis.speak(msg);
    }
  }
};

function getRandomHeartRate() {
  return Math.floor(Math.random() * 101) + 80; // 80-180 BPM
}

// Visual Effects
function createFloatingElements(type) {
  const chars = type === 'love' ? ['❤️', '💖', '✨'] : type === 'broken' ? ['🌑', '🔗', '🌫️'] : ['❄️', '🧊', '💎'];
  floatingInterval = setInterval(() => {
    const el = document.createElement('div');
    el.className = 'floating-el';
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.left = (Math.random() * 200 - 100) + 'px';
    const dx = (Math.random() - 0.5) * 400 + 'px';
    const dy = type === 'love' ? '-500px' : '500px';
    el.style.setProperty('--dx', dx);
    el.style.setProperty('--dy', dy);
    bgElements.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }, 300);
}

function createRain() {
  effectInterval = setInterval(() => {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = (Math.random() * 600 - 300) + 'px';
    heartContainer.appendChild(drop);
    setTimeout(() => drop.remove(), 2000);
  }, 40);
}

function createSnow() {
  effectInterval = setInterval(() => {
    const snow = document.createElement('div');
    snow.className = 'snow-particle';
    snow.style.left = (Math.random() * 600 - 300) + 'px';
    heartContainer.appendChild(snow);
    setTimeout(() => snow.remove(), 3000);
  }, 150);
}

function createConfetti() {
  const colors = ['#ff2d55', '#ff9d00', '#ffd700', '#ffffff', '#ff69b4'];
  effectInterval = setInterval(() => {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const tx = (Math.random() - 0.5) * 600 + 'px';
    const ty = (Math.random() - 0.5) * 600 + 'px';
    c.style.setProperty('--tx', tx);
    c.style.setProperty('--ty', ty);
    heartContainer.appendChild(c);
    setTimeout(() => c.remove(), 2500);
  }, 150);
}

function createParticles(color) {
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.backgroundColor = color;
    const tx = (Math.random() - 0.5) * 400 + 'px';
    const ty = (Math.random() - 0.5) * 400 + 'px';
    p.style.setProperty('--tx', tx);
    p.style.setProperty('--ty', ty);
    heartContainer.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}

function resetApp() {
  clearTimeout(measureTimeout);
  clearInterval(hapticInterval);
  clearInterval(effectInterval);
  clearInterval(progressInterval);
  clearInterval(floatingInterval);
  
  document.body.classList.remove('high', 'low', 'flaming', 'frozen');
  ekgContainer.classList.remove('active');
  scanLine.classList.remove('active');
  document.documentElement.style.setProperty('--fill-percent', '0%');
  
  document.querySelectorAll('.heart-half').forEach(h => {
    h.style.animationDuration = '1.5s';
    h.style.animationPlayState = 'running';
  });

  result.style.fontSize = '1.2rem';
  result.style.color = '#ffe4e1';
  result.style.transform = 'scale(1)';
}

function startMeasuring() {
  AudioEngine.init();
  resetApp();
  
  ekgContainer.classList.add('active');
  scanLine.classList.add('active');
  result.textContent = 'Scanning heart signature...';
  
  let progress = 0;
  progressInterval = setInterval(() => {
    progress += 1;
    document.documentElement.style.setProperty('--fill-percent', `${progress}%`);
    if (progress % 20 === 0) {
      AudioEngine.playThump();
      if ('vibrate' in navigator) navigator.vibrate(20); // Hold feedback
    }
    if (progress >= 100) clearInterval(progressInterval);
  }, 30);

  measureTimeout = setTimeout(() => {
    const bpm = getRandomHeartRate();
    const duration = 60 / bpm;
    
    ekgContainer.classList.remove('active');
    scanLine.classList.remove('active');

    let particleColor = '#ff2d55';
    let voiceText = "";

    if (bpm >= 170) {
      document.body.classList.add('flaming');
      result.textContent = `🔥 ${bpm} BPM: FLAMING SOUL!`;
      voiceText = "Warning. Flaming soul detected. Your heart is on fire!";
      particleColor = '#ff9d00';
      createConfetti();
      createFloatingElements('love');
      AudioEngine.playLove();
    } else if (bpm >= 150) {
      document.body.classList.add('high');
      result.textContent = `❤️ ${bpm} BPM: True Love!`;
      voiceText = "Analysis complete. True love detected.";
      particleColor = '#ff2d55';
      createConfetti();
      createFloatingElements('love');
      AudioEngine.playLove();
    } else if (bpm <= 95) {
      document.body.classList.add('frozen');
      result.textContent = `❄️ ${bpm} BPM: Frozen Solid.`;
      voiceText = "Alert. Heart is frozen solid. Cold as ice.";
      particleColor = '#b3e5fc';
      createSnow();
      createFloatingElements('frozen');
      AudioEngine.playFrozen();
    } else {
      document.body.classList.add('low');
      result.textContent = `💔 ${bpm} BPM: Heart broken.`;
      voiceText = "I am sorry. Your heart is broken.";
      particleColor = '#7f8c8d';
      createRain();
      createFloatingElements('broken');
      AudioEngine.playBroken();
    }

    VoiceEngine.speak(voiceText);

    document.querySelectorAll('.heart-half').forEach(h => {
      h.style.animationDuration = `${duration}s`;
    });

    if ('vibrate' in navigator) {
      // Lubb-Dubb Haptic Pattern
      hapticInterval = setInterval(() => {
        navigator.vibrate([50, 50, 40]);
      }, duration * 1000);
      
      // Initial Shatter/Success Buzz
      if (bpm < 150) navigator.vibrate([200, 100, 200]);
      else navigator.vibrate([100, 30, 100, 30, 300]);
    }

    createParticles(particleColor);
    result.style.fontSize = '1.8rem';
    result.style.color = '#fff';
    result.style.transform = 'scale(1.1)';
  }, 3000);
}

function cancelMeasuring() {
  if (measureTimeout) {
    clearTimeout(measureTimeout);
    clearInterval(progressInterval);
    if (result.textContent.includes('Scanning')) {
      result.textContent = 'SCAN TERMINATED';
      result.style.color = '#ff4444';
      ekgContainer.classList.remove('active');
      scanLine.classList.remove('active');
      document.documentElement.style.setProperty('--fill-percent', '0%');
    }
    measureTimeout = null;
  }
}

function updateTilt(clientX, clientY) {
  const x = (clientX - window.innerWidth / 2) / 20;
  const y = (clientY - window.innerHeight / 2) / 20;
  
  // Dynamic Shadows
  document.documentElement.style.setProperty('--sx', `${-x}px`);
  document.documentElement.style.setProperty('--sy', `${-y}px`);
  
  // 3D Parallax Tilt
  document.documentElement.style.setProperty('--rx', `${-y}deg`);
  document.documentElement.style.setProperty('--ry', `${x}deg`);
}

// Mouse Tracking for 3D Tilt & Shadows
document.addEventListener('mousemove', (e) => updateTilt(e.clientX, e.clientY));

// Touch Tracking for 3D Tilt on Mobile
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    updateTilt(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: true });

// Event Listeners
btn.addEventListener('mousedown', startMeasuring);
btn.addEventListener('mouseup', cancelMeasuring);
btn.addEventListener('mouseleave', cancelMeasuring);
btn.addEventListener('touchstart', (e) => { e.preventDefault(); startMeasuring(); });
btn.addEventListener('touchend', cancelMeasuring);
