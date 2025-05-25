// Background gradient management
const getBalancedColor = () => {
    // Generate balanced colors with darker tones
    const r = Math.floor(50 + Math.random() * 205); // 50-255
    const g = Math.floor(50 + Math.random() * 205); // 50-255
    const b = Math.floor(50 + Math.random() * 205); // 50-255
    return `rgb(${r}, ${g}, ${b})`;
};

const setRandomGradient = () => {
    const colors = Array.from({ length: 4 }, () => getBalancedColor());
    document.body.style.background = `linear-gradient(-45deg, ${colors.join(', ')})`;
    document.body.style.backgroundSize = '400% 400%';
};

// Initialize gradient background
setRandomGradient();
setInterval(setRandomGradient, 15000); // Change every 15s