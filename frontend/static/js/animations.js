// Scroll Animations and Interactions
class ScrollAnimations {
    constructor() {
        this.observer = null;
        this.lastScrollTop = 0;
        this.scrollDirection = 'down';
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupSmoothScrolling();
        this.setupMobileMenu();
        this.setupScrollEffects();
        this.setupTypingAnimations();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    
                    // Add staggered delays for child elements
                    if (entry.target.dataset.stagger) {
                        this.animateStaggeredChildren(entry.target);
                    }

                    // Add specific animation based on data attributes
                    const animationType = entry.target.dataset.animation;
                    if (animationType) {
                        entry.target.classList.add(`animate-${animationType}`);
                    }
                }
            });
        }, options);

        // Observe all elements with scroll-animate class
        document.querySelectorAll('.scroll-animate').forEach(el => {
            this.observer.observe(el);
        });
    }

    animateStaggeredChildren(parent) {
        const children = parent.querySelectorAll('.stagger-animate');
        children.forEach((child, index) => {
            child.style.animationDelay = `${index * 100}ms`;
            child.classList.add('animate-slide-up');
        });
    }

    setupSmoothScrolling() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for fixed header
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });

                    // Update URL hash without scrolling
                    history.pushState(null, null, this.getAttribute('href'));
                }
            });
        });

        // Update active navigation link on scroll
        window.addEventListener('scroll', this.debounce(() => {
            this.updateActiveNavLink();
        }, 100));
    }

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link, .nav-link-mobile');
        
        let current = '';
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('text-cyan-400', 'active');
            const href = link.getAttribute('href');
            if (href === `#${current}` || (current === 'home' && href === '#')) {
                link.classList.add('text-cyan-400', 'active');
            }
        });
    }

    setupMobileMenu() {
        const mobileMenuButton = document.getElementById('mobileMenuButton');
        const mobileMenu = document.getElementById('mobileMenu');

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                const isHidden = mobileMenu.classList.contains('hidden');
                
                if (isHidden) {
                    mobileMenu.classList.remove('hidden');
                    mobileMenu.classList.add('animate-slide-down');
                    mobileMenuButton.querySelector('i').className = 'fas fa-times text-xl';
                } else {
                    mobileMenu.classList.add('hidden');
                    mobileMenu.classList.remove('animate-slide-down');
                    mobileMenuButton.querySelector('i').className = 'fas fa-bars text-xl';
                }
            });

            // Close mobile menu when clicking on links
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.querySelector('i').className = 'fas fa-bars text-xl';
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target) && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.querySelector('i').className = 'fas fa-bars text-xl';
                }
            });
        }
    }

    setupScrollEffects() {
        // Navbar hide/show on scroll
        const navbar = document.querySelector('nav');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scroll down
                navbar.style.transform = 'translateY(-100%)';
                this.scrollDirection = 'down';
            } else {
                // Scroll up
                navbar.style.transform = 'translateY(0)';
                this.scrollDirection = 'up';
            }
            
            // Add background to navbar when scrolled
            if (currentScrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollY = currentScrollY;
        });

        // Parallax effect for background elements
        this.setupParallax();
    }

    setupParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            parallaxElements.forEach(element => {
                element.style.transform = `translate3d(0, ${rate}px, 0)`;
            });
        });
    }

    setupTypingAnimations() {
        // Initialize typing animation if element exists
        const typingElement = document.getElementById('heroTitle');
        if (typingElement) {
            this.initTypingAnimation(typingElement);
        }
    }

    initTypingAnimation(element) {
        const texts = JSON.parse(element.dataset.texts || '["Full-Stack Developer", "AI Enthusiast", "Problem Solver"]');
        const speed = parseInt(element.dataset.speed) || 100;
        const deleteSpeed = parseInt(element.dataset.deleteSpeed) || 50;
        const delay = parseInt(element.dataset.delay) || 2000;
        
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let isPaused = false;

        function type() {
            if (isPaused) return;

            const currentText = texts[textIndex];
            
            if (isDeleting) {
                element.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
            } else {
                element.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
            }

            let typeSpeed = isDeleting ? deleteSpeed : speed;

            if (!isDeleting && charIndex === currentText.length) {
                typeSpeed = delay;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                typeSpeed = 500;
            }

            setTimeout(type, typeSpeed);
        }

        // Start typing animation
        setTimeout(type, 1000);

        // Pause on hover
        element.addEventListener('mouseenter', () => {
            isPaused = true;
        });

        element.addEventListener('mouseleave', () => {
            isPaused = false;
            setTimeout(type, 500);
        });
    }

    // Utility function to debounce scroll events
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add CSS class for scroll-based animations
    addScrollClass(className, threshold = 0.5) {
        window.addEventListener('scroll', () => {
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const elementVisible = 150;
                
                if (elementTop < window.innerHeight - elementVisible) {
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            });
        });
    }

    // Initialize counter animations
    initCounters() {
        const counters = document.querySelectorAll('.counter');
        const speed = 200;

        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const increment = target / speed;

                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target;
                }
            };

            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    updateCount();
                }
            });

            observer.observe(counter);
        });
    }
}

// Particle System for Background Effects
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 100 };

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const numberOfParticles = (this.canvas.width * this.canvas.height) / 9000;
        this.particles = [];

        for (let i = 0; i < numberOfParticles; i++) {
            const size = (Math.random() * 2) + 1;
            const x = (Math.random() * ((this.canvas.width - size * 2) - (size * 2)) + size * 2);
            const y = (Math.random() * ((this.canvas.height - size * 2) - (size * 2)) + size * 2);
            const directionX = (Math.random() * 2) - 1;
            const directionY = (Math.random() * 2) - 1;

            this.particles.push({
                x, y, size, directionX, directionY,
                color: `rgba(34, 211, 238, ${Math.random() * 0.5})`
            });
        }
    }

    handleMouseMove(e) {
        this.mouse.x = e.x;
        this.mouse.y = e.y;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // Move particles
            p.x += p.directionX;
            p.y += p.directionY;

            // Bounce off walls
            if (p.x + p.size > this.canvas.width || p.x - p.size < 0) {
                p.directionX = -p.directionX;
            }
            if (p.y + p.size > this.canvas.height || p.y - p.size < 0) {
                p.directionY = -p.directionY;
            }

            // Mouse interaction
            if (this.mouse.x && this.mouse.y) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.mouse.radius) {
                    p.directionX = dx * 0.05;
                    p.directionY = dy * 0.05;
                }
            }

            // Draw particles
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        }
    }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.scrollAnimations = new ScrollAnimations();
    
    // Initialize particle system if canvas exists
    const particleCanvas = document.getElementById('particleCanvas');
    if (particleCanvas) {
        window.particleSystem = new ParticleSystem('particleCanvas');
    }

    // Initialize counters
    window.scrollAnimations.initCounters();

    // Add loading animation
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Remove loading screen if exists
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500);
        }
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScrollAnimations, ParticleSystem };
}
