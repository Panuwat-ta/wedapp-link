
        document.addEventListener("DOMContentLoaded", function () {
            // Initial animations
            gsap.from(".maintenance-container", { 
                opacity: 0, 
                y: -50, 
                duration: 1 
            });
            
            gsap.from(".qr-code", { 
                opacity: 0, 
                scale: 0.5, 
                duration: 1, 
                delay: 0.5 
            });
            
            // Set initial positions
            gsap.set(".rocket.left", { left: 50, bottom: -100 });
            gsap.set(".rocket.right", { right: 50, bottom: -100 });
            gsap.set(".rocket.center-left", { left: 150, bottom: -100 });
            gsap.set(".rocket.center-right", { right: 150, bottom: -100 });
            
            // Initial rocket movement (going up) for all rockets with staggered timing
            const rockets = [".rocket.left", ".rocket.right", ".rocket.center-left", ".rocket.center-right"];
            
            rockets.forEach((rocketSelector, index) => {
                gsap.to(rocketSelector, { 
                    y: -600, 
                    duration: 3,
                    delay: index * 0.5, // Stagger the start times
                    ease: "power2.inOut",
                    onComplete: function() {
                        const rocket = document.querySelector(rocketSelector);
                        // Reset position tracking for GSAP
                        gsap.set(rocket, { clearProps: "y" });
                        // Get actual position after animation
                        const rect = rocket.getBoundingClientRect();
                        // Set absolute position
                        gsap.set(rocket, { 
                            top: rect.top,
                            left: rect.left,
                            bottom: "auto",
                            right: "auto"
                        });
                        randomRocketMovement(rocketSelector);
                    }
                });
            });
            
            // Function for continuous random movement
            function randomRocketMovement(rocketSelector) {
                const rocket = document.querySelector(rocketSelector);
                const rocketWidth = rocket.offsetWidth;
                const rocketHeight = rocket.offsetHeight;
                
                // Viewport boundaries with padding
                const padding = 20;
                const maxX = window.innerWidth - rocketWidth - padding;
                const maxY = window.innerHeight - rocketHeight - padding;
                const minX = padding;
                const minY = padding;
                
                // Current position
                const rect = rocket.getBoundingClientRect();
                const currentX = rect.left;
                const currentY = rect.top;
                
                // Random new position within boundaries
                const newX = Math.max(minX, Math.min(maxX, Math.random() * maxX));
                const newY = Math.max(minY, Math.min(maxY, Math.random() * maxY));
                
                // Calculate angle based on movement direction
                const deltaX = newX - currentX;
                const deltaY = newY - currentY;
                const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                
                // Adjust angle to make top of rocket point in direction of movement
                const rotationAngle = angle + 90;
                
                // Random duration between 2-4 seconds
                const duration = 2 + Math.random() * 2;
                
                // Coin drop frequency
                const coinDropInterval = duration * 1000 / 5; // Drop 5 coins during movement
                
                // Create timeout for dropping coins at intervals
                let coinCounter = 0;
                const coinDropper = setInterval(function() {
                    // Calculate current position of rocket during movement
                    const progress = coinCounter / 5; // 0 to 1 based on 5 coins
                    const currentPosX = currentX + (deltaX * progress);
                    const currentPosY = currentY + (deltaY * progress);
                    
                    // Drop a coin at current position
                    createCoin(currentPosX + rocketWidth/2, currentPosY + rocketHeight/2);
                    
                    coinCounter++;
                    if (coinCounter >= 5) {
                        clearInterval(coinDropper);
                    }
                }, coinDropInterval);
                
                gsap.to(rocketSelector, {
                    left: newX,
                    top: newY,
                    rotation: rotationAngle,
                    duration: duration,
                    ease: "power1.inOut",
                    onComplete: function() {
                        // Continue with next random movement
                        randomRocketMovement(rocketSelector);
                    }
                });
            }
            
            // Function to create and animate falling coins
            function createCoin(x, y) {
                // Create new coin element
                const coin = document.createElement("img");
                coin.src = "/img/test2.png";
                coin.className = "coin";
                document.body.appendChild(coin);
                
                // Set initial position
                gsap.set(coin, {
                    left: x,
                    top: y,
                    rotation: Math.random() * 360,
                    opacity: 0
                });
                
                // Random horizontal shift
                const horizontalShift = -15 + Math.random() * 30;
                
                // Define falling animation
                const tl = gsap.timeline({
                    onComplete: function() {
                        // Remove coin element after animation
                        coin.remove();
                    }
                });
                
                // Coin animation sequence
                tl.to(coin, {
                    opacity: 1,
                    duration: 0.3
                })
                .to(coin, {
                    top: window.innerHeight + 50, // Fall below screen
                    left: "+=" + horizontalShift,
                    rotation: "+=" + (Math.random() * 720 - 360), // Random spin
                    duration: 2 + Math.random() * 2,
                    ease: "power1.in" // Accelerate as it falls
                });
                
                return coin;
            }
        });
 

