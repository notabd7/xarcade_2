// This script adds some optional animation and interactive effects

document.addEventListener('DOMContentLoaded', function() {
    // Make game cards more interactive
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('coming-soon')) {
                this.querySelector('.game-card-inner').style.boxShadow = 
                    '0 0 15px #0f0, 0 0 30px #0f0';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.querySelector('.game-card-inner').style.boxShadow = '';
        });
        
        // Add click effect for available games
        card.addEventListener('click', function() {
            if (!this.classList.contains('coming-soon')) {
                const playButton = this.querySelector('.play-button');
                if (playButton && playButton.href) {
                    window.location.href = playButton.href;
                }
            }
        });
    });
    
    // Create dynamic star field background as an alternative to CSS
    function createStarField() {
        const container = document.querySelector('.stars-container');
        
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${5 + Math.random() * 10}s`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(star);
        }
    }
    
  
    createStarField();
});