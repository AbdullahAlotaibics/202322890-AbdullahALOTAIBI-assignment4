// Game Inventory Portfolio JavaScript

let currentState = 'inventory'; // Track current view state
const STATE_STORAGE_KEY = 'gameInventoryState';
const SECRET_CLICK_KEY = 'secretUnlockCount';
const BEST_SCORE_KEY = 'secretBestScore';
const SECRET_UNLOCK_THRESHOLD = 3;
let secretHintTimeout = null;
let secretGameAnimationId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeInventory();
    initializeTabs();
    initializeBackButton();
    initializeQuestsSorting();
    restoreState();
    updateSecretSlotAppearance();
});

// Initialize inventory slots
function initializeInventory() {
    const inventorySlots = document.querySelectorAll('.inventory-slot:not(.empty)');

    inventorySlots.forEach(slot => {
        slot.addEventListener('click', function() {
            const itemType = this.dataset.item;
            if (itemType === 'secret') {
                handleSecretSlotClick();
            } else {
                showItemDetail(itemType);
            }
        });
    });

    // Update secret slot appearance
    updateSecretSlotAppearance();
}

function getSecretClickCount() {
    return parseInt(localStorage.getItem(SECRET_CLICK_KEY) || '0', 10);
}

function setSecretClickCount(count) {
    localStorage.setItem(SECRET_CLICK_KEY, count);
}

function updateSecretSlotAppearance() {
    const secretSlot = document.querySelector('[data-item="secret"]');
    if (!secretSlot) return;

    const isUnlocked = getSecretClickCount() >= SECRET_UNLOCK_THRESHOLD;
    if (isUnlocked) {
        secretSlot.classList.remove('locked');
        secretSlot.querySelector('.item-name').textContent = 'Secret Item';
        secretSlot.querySelector('.item-icon').textContent = '🕵️';
    } else {
        secretSlot.classList.add('locked');
        secretSlot.querySelector('.item-name').textContent = 'Locked Secret';
        secretSlot.querySelector('.item-icon').textContent = '🔒';
    }
}

function handleSecretSlotClick() {
    const currentCount = getSecretClickCount() + 1;
    setSecretClickCount(currentCount);

    if (currentCount >= SECRET_UNLOCK_THRESHOLD) {
        updateSecretSlotAppearance();
        showSecretHint('Secret unlocked! Opening the hidden game...');
        showItemDetail('secret');
        return;
    }

    // Show locked detail
    showItemDetail('secret-locked');
    showSecretHint(`Secret progress: ${currentCount}/${SECRET_UNLOCK_THRESHOLD}. Click again to unlock.`);
}

function showSecretHint(message) {
    const hint = document.getElementById('secret-hint');
    if (!hint) return;
    hint.textContent = message;
    hint.classList.remove('hidden');

    if (secretHintTimeout) {
        clearTimeout(secretHintTimeout);
    }

    secretHintTimeout = setTimeout(() => {
        hint.classList.add('hidden');
    }, 2800);
}

// Initialize tab switching
function initializeTabs() {
    const menuButtons = document.querySelectorAll('.menu-btn');

    menuButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentState === 'item-detail') {
                // If viewing item detail, go back to inventory first
                goBackToInventory();
                setTimeout(() => {
                    const tabId = this.dataset.tab;
                    switchTab(tabId, button);
                }, 300);
            } else {
                const tabId = this.dataset.tab;
                switchTab(tabId, button);
            }
        });
    });
}

function switchTab(tabId, button) {
    // Remove active class from all buttons and tabs
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });

    // Add active class to clicked button and corresponding tab
    if (button) {
        button.classList.add('active');
    }
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.classList.remove('hidden');
        tab.classList.add('active');
    }
    currentState = 'inventory';
    saveState({ type: 'tab', tab: tabId });
}

// Initialize back button
function initializeBackButton() {
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', goBackToInventory);
}

// Initialize quests sorting
function initializeQuestsSorting() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sortType = this.dataset.sort;
            sortQuests(sortType);
            // Update active button
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function sortQuests(sortType) {
    const questsList = document.querySelector('.quests-list');
    const quests = Array.from(document.querySelectorAll('.quest-item'));

    let sortedQuests;

    switch (sortType) {
        case 'alphabetical':
            sortedQuests = quests.sort((a, b) => {
                const titleA = a.querySelector('h4').textContent.toLowerCase();
                const titleB = b.querySelector('h4').textContent.toLowerCase();
                return titleA.localeCompare(titleB);
            });
            break;
        case 'important':
            sortedQuests = quests.sort((a, b) => {
                const priorityA = parseInt(a.dataset.priority) || 999;
                const priorityB = parseInt(b.dataset.priority) || 999;
                return priorityA - priorityB;
            });
            break;
        case 'progress':
            sortedQuests = quests.sort((a, b) => {
                const progressA = parseInt(a.dataset.progress) || 0;
                const progressB = parseInt(b.dataset.progress) || 0;
                return progressB - progressA; // Descending order
            });
            break;
        case 'default':
        default:
            // Restore original order based on data-priority or something, but for now, just return as is
            sortedQuests = quests;
            break;
    }

    // Reorder the DOM elements
    sortedQuests.forEach(quest => {
        questsList.appendChild(quest);
    });
}

// Show item detail view
function showItemDetail(itemType) {
    const itemData = getItemData(itemType);
    
    // Hide all current views
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });

    // Remove active from menu buttons
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));

    // Show back button
    const backContainer = document.querySelector('.back-button-container');
    backContainer.classList.remove('hidden');

    // Update item detail view
    const detailIcon = document.querySelector('.item-detail-icon');
    const detailTitle = document.querySelector('.item-detail-title');
    const detailContent = document.querySelector('.item-detail-content');

    detailIcon.textContent = itemData.icon;
    detailTitle.textContent = itemData.title;
    detailContent.innerHTML = itemData.content;

    if (itemType === 'integrations') {
        const apiButton = document.getElementById('fetch-fact-btn');
        const apiOutput = document.getElementById('api-fact-output');
        if (apiButton) {
            apiButton.onclick = () => {
                fetchFunFact(apiOutput);
            };
        }
    }

    if (itemType === 'secret') {
        const itemDetail = document.getElementById('item-detail');
        itemDetail.classList.add('secret-unlock-animation');
        setTimeout(() => {
            itemDetail.classList.remove('secret-unlock-animation');
        }, 1000);
        initializeSecretGame();
    }

    saveState({ type: 'detail', item: itemType });

    // Show item detail view
    const itemDetail = document.getElementById('item-detail');
    itemDetail.classList.remove('hidden');
    itemDetail.classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);
    currentState = 'item-detail';
}

// Go back to inventory
function goBackToInventory() {
    // Hide back button
    const backContainer = document.querySelector('.back-button-container');
    backContainer.classList.add('hidden');

    // Hide item detail
    document.getElementById('item-detail').classList.add('hidden');
    document.getElementById('item-detail').classList.remove('active');

    // Show inventory
    const inventoryTab = document.getElementById('inventory');
    inventoryTab.classList.remove('hidden');
    inventoryTab.classList.add('active');

    // Set inventory button as active
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-tab="inventory"]').classList.add('active');
    saveState({ type: 'tab', tab: 'inventory' });

    window.scrollTo(0, 0);
    currentState = 'inventory';
}

function saveState(state) {
    try {
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.warn('Could not save state:', error);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STATE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function restoreState() {
    const stored = loadState();
    if (!stored) return;

    if (stored.type === 'detail' && stored.item) {
        showItemDetail(stored.item);
        return;
    }

    if (stored.type === 'tab' && stored.tab) {
        const button = document.querySelector(`[data-tab="${stored.tab}"]`);
        if (button) {
            switchTab(stored.tab, button);
            return;
        }
    }
}

// Get item data based on type
function getItemData(itemType) {
    const itemDatabase = {
        about: {
            icon: '👨‍💻',
            title: 'About Me',
            content: `
                <p><strong>Level 22 Game Developer</strong></p>
                <p>Hi! I'm Abdullah Al-Otaibi, a passionate Computer Science student with a love for game development. I believe that great games are more than just entertainment—they're immersive experiences that combine technical excellence with creative storytelling.</p>
                <p>My journey in game development started with curiosity and has evolved into a dedicated pursuit of creating meaningful interactive experiences. I enjoy tackling complex problems and turning them into engaging gameplay mechanics.</p>
                <div class="item-stats">
                    <div class="stat-item">
                        <span class="stat-label">Location:</span>
                        <span class="stat-value">Dhahran, Saudi Arabia</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Languages:</span>
                        <span class="stat-value">Arabic (Native), English (Fluent)</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Interests:</span>
                        <span class="stat-value">Game Design, Programming, UI/UX</span>
                    </div>
                </div>
            `
        },
        skills: {
            icon: '⚡',
            title: 'Technical Skills',
            content: `
                <h3>Core Programming Skills</h3>
                <ul>
                    <li><strong>C#</strong> - Primary language for Unity development</li>
                    <li><strong>JavaScript</strong> - Web development and interactive experiences</li>
                    <li><strong>Python</strong> - Data processing and automation</li>
                    <li><strong>C++</strong> - Performance-critical game systems</li>
                </ul>

                <h3>Game Development Tools</h3>
                <ul>
                    <li><strong>Unity Engine</strong> - 2D/3D game development</li>
                    <li><strong>Unreal Engine</strong> - Advanced graphics and physics</li>
                    <li><strong>Blender</strong> - 3D modeling and animation</li>
                    <li><strong>Photoshop/GIMP</strong> - 2D art and UI design</li>
                </ul>

                <h3>Web Technologies</h3>
                <ul>
                    <li><strong>HTML5/CSS3</strong> - Modern web development</li>
                    <li><strong>React/Vue.js</strong> - Frontend frameworks</li>
                    <li><strong>Node.js</strong> - Backend development</li>
                </ul>

                <div class="skill-showcase">
                    <p><em>Currently leveling up in:</em> Advanced shader programming, AI systems, and multiplayer networking</p>
                </div>
            `
        },
        projects: {
            icon: '🎮',
            title: 'Game Projects',
            content: `
                <h3>Featured Projects</h3>

                <div class="project-item">
                    <h4>🚀 2D Platformer Game</h4>
                    <p>A complete 2D platformer built in Unity featuring custom physics, level design, and engaging gameplay mechanics. Includes power-ups, enemy AI, and multiple levels.</p>
                    <div class="project-tech">Technologies: Unity, C#, Aseprite</div>
                </div>

                <div class="project-item">
                    <h4>🧩 Puzzle Game Prototype</h4>
                    <p>An innovative puzzle game with procedural level generation. Features adaptive difficulty, intuitive controls, and challenging mechanics that scale with player skill.</p>
                    <div class="project-tech">Technologies: Unity, C#, Algorithm design</div>
                </div>

                <div class="project-item">
                    <h4>🎯 Mobile Game Concept</h4>
                    <p>A casual mobile game concept focusing on quick gameplay sessions. Designed with touch controls in mind and optimized for mobile performance.</p>
                    <div class="project-tech">Technologies: Unity, Mobile optimization</div>
                </div>

                <div class="project-item">
                    <h4>🎨 Game Jam Projects</h4>
                    <p>Various prototypes created during game jams, including a rhythm-based game, a tower defense game, and experimental mechanics.</p>
                    <div class="project-tech">Technologies: Unity, Godot, Various</div>
                </div>

                <div class="project-status">
                    <p><strong>Current Project:</strong> Working on an indie adventure game with branching narratives and player choice systems.</p>
                </div>
            `
        },
        experience: {
            icon: '💼',
            title: 'Experience',
            content: `
                <h3>Professional Experience</h3>

                <div class="experience-item">
                    <h4>🎮 Game Development Intern</h4>
                    <p><strong>Local Game Studio</strong> | 2023 - Present</p>
                    <ul>
                        <li>Developed gameplay mechanics for mobile games</li>
                        <li>Collaborated with artists and designers on game features</li>
                        <li>Optimized game performance for various devices</li>
                        <li>Participated in game design and prototyping sessions</li>
                    </ul>
                </div>

                <div class="experience-item">
                    <h4>💻 Web Development Freelance</h4>
                    <p><strong>Self-Employed</strong> | 2022 - Present</p>
                    <ul>
                        <li>Created interactive websites for small businesses</li>
                        <li>Developed custom web applications</li>
                        <li>Implemented responsive designs and user-friendly interfaces</li>
                    </ul>
                </div>

                <div class="experience-item">
                    <h4>🎓 Academic Projects</h4>
                    <p><strong>King Fahd University of Petroleum & Minerals</strong> | 2020 - Present</p>
                    <ul>
                        <li>Led development of multiple software projects</li>
                        <li>Collaborated on team-based programming assignments</li>
                        <li>Applied computer science concepts to real-world problems</li>
                    </ul>
                </div>
            `
        },
        education: {
            icon: '🎓',
            title: 'Education',
            content: `
                <h3>Academic Background</h3>

                <div class="education-item">
                    <h4>🎓 Bachelor of Science in Computer Science</h4>
                    <p><strong>King Fahd University of Petroleum & Minerals (KFUPM)</strong></p>
                    <p><strong>Expected Graduation:</strong> 2027</p>
                    <p><strong>Location:</strong> Dhahran, Saudi Arabia</p>
                </div>

                <h3>Relevant Coursework</h3>
                <div class="coursework-grid">
                    <div class="course-category">
                        <h4>Programming & Algorithms</h4>
                        <ul>
                            <li>Data Structures & Algorithms</li>
                            <li>Object-Oriented Programming</li>
                            <li>Software Engineering</li>
                            <li>Database Systems</li>
                        </ul>
                    </div>
                    <div class="course-category">
                        <h4>Game Development</h4>
                        <ul>
                            <li>Computer Graphics</li>
                            <li>Game Design Principles</li>
                            <li>Interactive Systems</li>
                            <li>Human-Computer Interaction</li>
                        </ul>
                    </div>
                    <div class="course-category">
                        <h4>Mathematics & Science</h4>
                        <ul>
                            <li>Discrete Mathematics</li>
                            <li>Linear Algebra</li>
                            <li>Calculus</li>
                            <li>Physics</li>
                        </ul>
                    </div>
                </div>

                <h3>Certifications & Online Learning</h3>
                <ul>
                    <li>🎮 Unity Certified Developer</li>
                    <li>💻 Google IT Support Professional</li>
                    <li>🎯 Game Development Specialization (Coursera)</li>
                    <li>📚 Various Udemy courses on advanced programming topics</li>
                </ul>
            `
        },
        tools: {
            icon: '🛠️',
            title: 'Development Tools',
            content: `
               <h3>Game Development</h3>
                <div class="tools-grid">
                    <div class="tool-item">
                        <div class="tool-icon">🎮</div>
                        <div class="tool-details">
                            <h4>Unity</h4>
                            <p>Main engine for building 2D games. Experience with gameplay systems, abilities, and UI.</p>
                        </div>
                    </div>
                    <div class="tool-item">
                        <div class="tool-icon">🧠</div>
                        <div class="tool-details">
                            <h4>C#</h4>
                            <p>Core scripting language for Unity. Used for game logic, combat systems, and player abilities.</p>
                        </div>
                    </div>
                    <div class="tool-item">
                        <div class="tool-icon">🎨</div>
                        <div class="tool-details">
                            <h4>2D Art Tools</h4>
                            <p>Basic experience creating pixel art and animations for game prototypes.</p>
                        </div>
                    </div>
                </div>

                <h3>Software Development</h3>
                <div class="tools-grid">
                    <div class="tool-item">
                        <div class="tool-icon">💻</div>
                        <div class="tool-details">
                            <h4>Visual Studio Code</h4>
                            <p>Main editor for web and backend development.</p>
                        </div>
                    </div>
                    <div class="tool-item">
                        <div class="tool-icon">⚛️</div>
                        <div class="tool-details">
                            <h4>React + Vite</h4>
                            <p>Frontend development for projects like ModelWatch dashboard.</p>
                        </div>
                    </div>
                    <div class="tool-item">
                        <div class="tool-icon">🗄️</div>
                        <div class="tool-details">
                            <h4>SQL (MySQL)</h4>
                            <p>Database design and queries for web applications.</p>
                        </div>
                    </div>
                    <div class="tool-item">
                        <div class="tool-icon">☕</div>
                        <div class="tool-details">
                            <h4>Java</h4>
                            <p>Used for data structures, algorithms, and academic projects.</p>
                        </div>
                    </div>
                </div>

                <h3>Tools & Workflow</h3>
                <div class="tools-grid">
                    <div class="tool-item">
                        <div class="tool-icon">🔧</div>
                        <div class="tool-details">
                            <h4>Git & GitHub</h4>
                            <p>Version control and collaboration (ModelWatch project).</p>
                        </div>
                    </div>
                    <div class="tool-item">
                        <div class="tool-icon">🧪</div>
                        <div class="tool-details">
                            <h4>XAMPP</h4>
                            <p>Local development environment for backend and database testing.</p>
                        </div>
                    </div>
                </div>

                <h3>Currently Learning</h3>
                <ul>
                    <li>🎮 Advanced Unity systems (combat & AI)</li>
                    <li>🧠 Game AI & pathfinding</li>
                    <li>🌐 Full-stack development (React + backend integration)</li>
                    <li>🤖 Machine learning concepts for future projects</li>
                </ul>
            `
        },
        integrations: {
            icon: '🔗',
            title: 'APIs & Integrations',
            content: `
                <h3>External APIs & Services</h3>
                <p>I integrate external APIs and services to build connected, data-driven applications and game systems.</p>

                <h4>Integration Examples</h4>
                <ul>
                    <li><strong>REST APIs</strong> - Fetching game data, leaderboards, and analytics</li>
                    <li><strong>OAuth</strong> - Secure authentication and user login flows</li>
                    <li><strong>Payment gateways</strong> - In-game purchases and premium features</li>
                    <li><strong>Cloud services</strong> - AWS, Firebase, and Google Cloud for backend support</li>
                </ul>

                <h4>Why It Matters</h4>
                <p>Connecting services allows me to build richer game experiences with live data, multiplayer components, and seamless user workflows.</p>

                <h4>Integration Skills</h4>
                <ul>
                    <li>API design and consumption</li>
                    <li>JSON/XML parsing</li>
                    <li>Webhook setup and event handling</li>
                    <li>Service orchestration and cloud deployment</li>
                </ul>

                <div class="skill-showcase">
                    <p><em>Example:</em> I built this small demo to experiment with APIs by fetching random fun facts from the web. It helped me understand how to connect frontend interfaces with external data sources in real time.</p>
                </div>

                <div class="api-demo-panel">
                    <h4>Live Fun Fact Demo</h4>
                    <p>This is a simple API integration I created to practice working with real-time data. Click the button to fetch a random fact.</p>
                    <button id="fetch-fact-btn" class="api-button">Fetch Fun Fact</button>
                    <div id="api-fact-output" class="api-output">Press the button to load a random fact.</div>
                </div>
            `
        },
        contact: {
            icon: '📧',
            title: 'Contact Information',
            content: `
                <h3>Get In Touch</h3>
                <p>I'm always interested in new opportunities, collaborations, and interesting projects. Feel free to reach out!</p>

                <div class="contact-methods">
                    <div class="contact-item">
                        <div class="contact-icon">📧</div>
                        <div class="contact-details">
                            <h4>Email</h4>
                            <p>cs.abdullah.alotaibi@gmail.com</p>
                            <a href="mailto:cs.abdullah.alotaibi@gmail.com" class="contact-link">Send Email</a>
                        </div>
                    </div>

                    <div class="contact-item">
                        <div class="contact-icon">🐙</div>
                        <div class="contact-details">
                            <h4>GitHub</h4>
                            <p>Check out my code and projects</p>
                            <a href="https://github.com/AbdullahAlotaibics"  target="_blank" class="contact-link">View Repositories</a>
                        </div>
                    </div>

                </div>

                <div class="availability">
                    <h3>Availability</h3>
                    <p><strong>Status:</strong> <span class="status available">Available for opportunities</span></p>
                    <p><strong>Preferred:</strong> Game Development, Full-stack Development, Freelance Projects</p>
                    <p><strong>Location:</strong> Open to remote work, based in Dhahran, Saudi Arabia</p>
                </div>
            `
        },
        hobbies: {
            icon: '🎯',
            title: 'Hobbies & Interests',
            content: `
                <h3>Beyond Coding</h3>
                <p>When I'm not developing games or writing code, I enjoy various activities that fuel my creativity and keep me balanced.</p>

                <div class="hobbies-grid">
                    <div class="hobby-item">
                        <div class="hobby-icon">🎮</div>
                        <div class="hobby-details">
                            <h4>Playing Games</h4>
                            <p>Always analyzing game mechanics, studying level design, and getting inspired by other developers' work.</p>
                        </div>
                    </div>

                    <div class="hobby-item">
                        <div class="hobby-icon">🎨</div>
                        <div class="hobby-details">
                            <h4>Digital Art</h4>
                            <p>Creating pixel art, experimenting with digital painting, and designing game assets.</p>
                        </div>
                    </div>

                    <div class="hobby-item">
                        <div class="hobby-icon">📚</div>
                        <div class="hobby-details">
                            <h4>Reading</h4>
                            <p>Technical books, game design theory, sci-fi novels, and anything that sparks new ideas.</p>
                        </div>
                    </div>

                    <div class="hobby-item">
                        <div class="hobby-icon">🏃‍♂️</div>
                        <div class="hobby-details">
                            <h4>Fitness</h4>
                            <p>Running, gym workouts, and staying active to maintain focus and energy for development work.</p>
                        </div>
                    </div>

                    <div class="hobby-item">
                        <div class="hobby-icon">🎵</div>
                        <div class="hobby-details">
                            <h4>Music</h4>
                            <p>Listening to game soundtracks, electronic music, and occasionally producing simple tracks.</p>
                        </div>
                    </div>

                    <div class="hobby-item">
                        <div class="hobby-icon">🌍</div>
                        <div class="hobby-details">
                            <h4>Travel</h4>
                            <p>Exploring new places, experiencing different cultures, and finding inspiration for game worlds.</p>
                        </div>
                    </div>
                </div>

                <h3>Game Jams & Communities</h3>
                <p>I'm active in the game development community:</p>
                <ul>
                    <li>🎯 Regular participant in game jams (Ludum Dare, GMTK)</li>
                    <li>💬 Active on Reddit (r/gamedev, r/Unity3D)</li>
                    <li>🤝 Member of local game development meetups</li>
                    <li>📝 Contributor to open-source game projects</li>
                </ul>
            `
        },
        secret: {
            icon: '🕵️',
            title: 'Secret Game Unlocked!',
            content: `
                <div class="secret-content">
                    <h3>🎉 Congratulations!</h3>
                    <p>You've successfully unlocked the hidden secret item!This reveals a special Flappy Bird–style mini-game just for you.</p>

                    <div class="flappy-game-panel">
                        <div class="flappy-header">
                            <div>
                                <div class="game-score">Score: <span id="flappy-score">0</span></div>
                                <div class="game-best-score">Best: <span id="flappy-best-score">0</span></div>
                            </div>
                            <div class="flappy-buttons">
                                <button id="flappy-start" class="api-button">Start Game</button>
                                <button id="flappy-restart" class="api-button" style="display:none;">Restart</button>
                            </div>
                        </div>
                        <div class="flappy-canvas-wrapper">
                            <canvas id="flappyCanvas" width="720" height="480"></canvas>
                            <div id="flappy-countdown" class="game-countdown" style="display:none;">3</div>
                        </div>
                        <p class="game-instructions">Click "Start Game" to begin. You'll have 3 seconds to prepare!</p>
                    </div>
                </div>
            `
        },
        'secret-locked': {
            icon: '🔒',
            title: 'Locked Secret',
            content: `
                <div class="secret-content">
                    <h3>🔒 This Secret is Locked</h3>
                    <p>This item is currently locked. To unlock it, you need to click on the "Locked Secret" slot in the inventory three times.</p>
                    <p>Each click brings you closer to discovering what's hidden inside!</p>
                    <div class="locked-hint">
                        <p><strong>Hint:</strong> Keep clicking the locked secret slot to progress.</p>
                    </div>
                </div>
            `
        }
    };

    return itemDatabase[itemType] || {
        icon: '❓',
        title: 'Unknown Item',
        content: '<p>This item seems to be corrupted or missing. Try refreshing the page!</p>'
    };
}

// Fetch a live fun fact from a public API
function fetchFunFact(outputElement) {
    if (!outputElement) return;

    outputElement.textContent = 'Loading fun fact...';

    fetch('https://catfact.ninja/fact')
        .then(response => {
            if (!response.ok) throw new Error('API response not OK');
            return response.json();
        })
        .then(data => {
            if (data && data.fact) {
                outputElement.textContent = data.fact;
            } else {
                outputElement.textContent = 'Sorry, no fun fact was returned.';
            }
        })
        .catch(error => {
            console.error('Fun fact fetch error:', error);
            outputElement.textContent = 'Unable to load a fun fact right now. Try again later.';
        });
}

function initializeSecretGame() {
    const canvas = document.getElementById('flappyCanvas');
    const scoreDisplay = document.getElementById('flappy-score');
    const bestScoreDisplay = document.getElementById('flappy-best-score');
    const startBtn = document.getElementById('flappy-start');
    const restartBtn = document.getElementById('flappy-restart');
    const countdownDisplay = document.getElementById('flappy-countdown');
    if (!canvas || !scoreDisplay || !bestScoreDisplay || !startBtn || !restartBtn || !countdownDisplay) return;

    if (secretGameAnimationId) {
        cancelAnimationFrame(secretGameAnimationId);
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const bird = { x: 100, y: height / 2, width: 28, height: 20, velocity: 0 };
    const gravity = 0.45;
    const flapPower = -8;
    const pipeWidth = 60;
    const pipeGap = 150;
    const pipeSpeed = 2.8;
    let pipes = [];
    let frame = 0;
    let score = 0;
    let gameOver = false;
    let gameStarted = false;

    function resetGame() {
        pipes = [];
        frame = 0;
        score = 0;
        gameOver = false;
        gameStarted = false;
        bird.y = height / 2;
        bird.velocity = 0;
        scoreDisplay.textContent = score;
        bestScoreDisplay.textContent = getBestScore();
        canvas.style.display = 'block';
        countdownDisplay.style.display = 'none';
        startBtn.style.display = 'inline-block';
        restartBtn.style.display = 'none';
    }

    function spawnPipe() {
        const topHeight = 80 + Math.random() * (height - pipeGap - 180);
        pipes.push({ x: width, top: topHeight, bottom: topHeight + pipeGap, passed: false });
    }

    function detectCollision(pipe) {
        return bird.x < pipe.x + pipeWidth && bird.x + bird.width > pipe.x &&
            (bird.y < pipe.top || bird.y + bird.height > pipe.bottom);
    }

    function drawScene() {
        ctx.fillStyle = '#010b18';
        ctx.fillRect(0, 0, width, height);

        // Draw background grid
        for (let x = 0; x < width; x += 40) {
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw bird
        ctx.fillStyle = '#f9d64d';
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        ctx.fillStyle = '#222';
        ctx.fillRect(bird.x + bird.width - 6, bird.y + 6, 6, 6);

        // Draw pipes
        pipes.forEach(pipe => {
            ctx.fillStyle = '#24b47e';
            ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
            ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, height - pipe.bottom);
        });

        // Draw ground line
        ctx.strokeStyle = '#ffffff33';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height - 10);
        ctx.lineTo(width, height - 10);
        ctx.stroke();

        if (gameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#fff';
            ctx.font = '28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', width / 2, height / 2 - 20);
            ctx.font = '18px Arial';
            ctx.fillText('Press restart or click to play again', width / 2, height / 2 + 20);
        }
    }

    function update() {
        if (gameStarted && !gameOver) {
            bird.velocity += gravity;
            bird.y += bird.velocity;
            frame += 1;

            if (frame % 90 === 0) {
                spawnPipe();
            }

            pipes.forEach(pipe => {
                pipe.x -= pipeSpeed;
                if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
                    pipe.passed = true;
                    score += 1;
                    scoreDisplay.textContent = score;
                }
                if (detectCollision(pipe)) {
                    gameOver = true;
                }
            });

            pipes = pipes.filter(pipe => pipe.x + pipeWidth > -20);
            if (bird.y + bird.height > height - 10 || bird.y < 0) {
                gameOver = true;
            }

            if (gameOver) {
                updateBestScore();
            }
        }

        drawScene();
        secretGameAnimationId = requestAnimationFrame(update);
    }

    function flap() {
        if (gameOver) {
            resetGame();
        } else if (gameStarted) {
            bird.velocity = flapPower;
        }
    }

    function startCountdown() {
        let count = 3;
        countdownDisplay.textContent = count;
        countdownDisplay.style.display = 'block';

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownDisplay.textContent = count;
            } else {
                clearInterval(countdownInterval);
                countdownDisplay.style.display = 'none';
                gameStarted = true;
            }
        }, 1000);
    }

    function handleKeydown(event) {
        if (event.code === 'Space') {
            event.preventDefault();
            flap();
        }
    }

    function getBestScore() {
        return parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0', 10);
    }

    function setBestScore(value) {
        localStorage.setItem(BEST_SCORE_KEY, value);
        bestScoreDisplay.textContent = value;
    }

    function updateBestScore() {
        const currentBest = getBestScore();
        if (score > currentBest) {
            setBestScore(score);
        } else {
            bestScoreDisplay.textContent = currentBest;
        }
    }

    startBtn.onclick = () => {
        startBtn.style.display = 'none';
        restartBtn.style.display = 'inline-block';
        countdownDisplay.style.display = 'block';
        startCountdown();
    };

    restartBtn.onclick = resetGame;
    canvas.onclick = flap;
    window.onkeydown = handleKeydown;

    resetGame();
    update();
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to inventory slots
    const slots = document.querySelectorAll('.inventory-slot');
    slots.forEach(slot => {
        slot.addEventListener('mouseenter', function() {
            if (!this.classList.contains('empty')) {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            }
        });

        slot.addEventListener('mouseleave', function() {
            if (!this.classList.contains('empty')) {
                this.style.transform = 'translateY(0) scale(1)';
            }
        });
    });

    // Add click ripple effect
    slots.forEach(slot => {
        slot.addEventListener('click', function(e) {
            if (!this.classList.contains('empty')) {
                const ripple = document.createElement('div');
                ripple.className = 'ripple';
                ripple.style.left = e.offsetX + 'px';
                ripple.style.top = e.offsetY + 'px';
                this.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            }
        });
    });
});
