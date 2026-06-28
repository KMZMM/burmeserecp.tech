// Initial Mock Data
const INITIAL_ANNOUNCEMENTS = [
    { id: 1, title: "Summer Farmers Market Starting This Saturday", content: "Join us at the town square from 8 AM to 1 PM for local produce, baked goods, and handmade crafts.", time: "2 hours ago", isAlert: false },
    { id: 2, title: "Scheduled Power Maintenance - Maple Avenue Area", content: "Utility services will perform maintenance work on Tuesday between 1:00 AM and 4:00 AM. Expect brief interruptions.", time: "1 day ago", isAlert: true },
    { id: 3, title: "Volunteer Drive: Oakwood Valley Library Cleanup", content: "The library is looking for volunteers to help organize the children's section next Sunday at 10 AM.", time: "2 days ago", isAlert: false }
];

const INITIAL_BUSINESSES = [
    { id: 1, name: "Oakwood Brews", category: "Dining", desc: "A cozy neighborhood cafe offering specialty coffees, artisan tea, and freshly baked pastries.", contact: "102 Main Street | (555) 0192" },
    { id: 2, name: "Valley Outfitters", category: "Shopping", desc: "Premium gear and clothing for hiking, camping, and enjoying the great outdoors in Oakwood.", contact: "45 Alpine Way | (555) 4382" },
    { id: 3, name: "Spruce Street Auto Clinic", category: "Automotive", desc: "Reliable, community-trusted car maintenance, repairs, and diagnostics. Family-owned since 1998.", contact: "304 Spruce Street | (555) 8931" }
];

const INITIAL_EVENTS = [
    { id: 1, title: "Annual Community Picnic", date: "July 12th, 12:00 PM - 4:00 PM", location: "Oakwood Valley Central Park", desc: "Bring your favorite dish! Games, music, and friendly vibes guaranteed. Drinks and grills provided by the Town Council.", goingCount: 24, userGoing: false },
    { id: 2, title: "Intro to Coding Workshop", date: "July 18th, 6:00 PM - 8:00 PM", location: "Community Library Learning Lab", desc: "A free introductory session on web development basics for teenagers and adults. No prior coding experience required.", goingCount: 8, userGoing: false }
];

const INITIAL_ISSUES = [
    { id: 1, title: "Pothole near Elm St Crossing", location: "Corner of Elm and 3rd", desc: "A deep pothole has formed in the westbound lane, causing cars to swerve. Requires urgent patching.", status: "open", time: "Submitted yesterday" },
    { id: 2, title: "Streetlight Outage - Spruce St", location: "Spruce St (in front of #142)", desc: "The streetlight has been flicking for a week and went completely dark last night.", status: "review", time: "Submitted 3 days ago" },
    { id: 3, title: "Broken Swing at Central Park Playground", location: "Central Park Playground", desc: "One of the swings has a snapped chain. Tape placed, but needs replacement.", status: "resolved", time: "Resolved 4 hours ago" }
];

const INITIAL_MARKETPLACE = [
    { id: 1, title: "Road Bike - Trek Domane (Excellent Condition)", price: "$450", desc: "Frame size 54cm, light wear, ready to ride. Upgraded tires recently. Selling because I am moving.", contact: "Text Dave: (555) 4920" },
    { id: 2, title: "Free Cedar Wood Pallets", price: "Free", desc: "About 6 pallets in decent condition. Great for DIY projects or firewood. First come, first served.", contact: "Pickup behind 405 Spruce St" }
];

// App State Manager
class TownHubApp {
    constructor() {
        this.initializeData();
        this.initDOM();
        this.initEvents();
        this.renderAll();
    }

    // Read or Setup Local Storage Data
    initializeData() {
        this.announcements = this.loadLocalStorage('th_announcements', INITIAL_ANNOUNCEMENTS);
        this.businesses = this.loadLocalStorage('th_businesses', INITIAL_BUSINESSES);
        this.events = this.loadLocalStorage('th_events', INITIAL_EVENTS);
        this.issues = this.loadLocalStorage('th_issues', INITIAL_ISSUES);
        this.marketplace = this.loadLocalStorage('th_marketplace', INITIAL_MARKETPLACE);
    }

    loadLocalStorage(key, defaultValue) {
        const stored = localStorage.getItem(key);
        if (!stored) {
            localStorage.setItem(key, JSON.stringify(defaultValue));
            return defaultValue;
        }
        return JSON.parse(stored);
    }

    saveState(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        this.updateStats();
    }

    // Cache DOM Elements
    initDOM() {
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.navLinks = document.querySelectorAll('#main-nav .nav-link, .nav-link[data-view]');
        this.viewSections = document.querySelectorAll('.view-section');

        // Lists/Grids Containers
        this.announcementsList = document.getElementById('announcements-list');
        this.directoryGrid = document.getElementById('directory-grid');
        this.eventsGrid = document.getElementById('events-grid');
        this.issuesGrid = document.getElementById('issues-grid');
        this.marketplaceGrid = document.getElementById('marketplace-grid');

        // Search inputs
        this.directorySearch = document.getElementById('directory-search');
        this.eventsSearch = document.getElementById('events-search');
        this.marketplaceSearch = document.getElementById('marketplace-search');

        // Modals
        this.modals = {
            business: document.getElementById('modal-business'),
            event: document.getElementById('modal-event'),
            issue: document.getElementById('modal-issue'),
            item: document.getElementById('modal-item')
        };

        // Open modal triggers
        this.modalTriggers = {
            business: document.getElementById('btn-add-business'),
            event: document.getElementById('btn-host-event'),
            issue: document.getElementById('btn-report-issue'),
            item: document.getElementById('btn-add-item')
        };

        // Civic issue filters
        this.issuesFilterTabs = document.querySelectorAll('#issues-filter-tabs .filter-tab');
        this.currentIssueFilter = 'all';

        // Stats Counters
        this.statBusinesses = document.getElementById('stat-businesses');
        this.statEvents = document.getElementById('stat-events');
        this.statIssues = document.getElementById('stat-issues');
        this.statMarketplace = document.getElementById('stat-marketplace');
    }

    // Wire up events
    initEvents() {
        // Theme switching
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Nav view switching
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Search Handlers
        this.directorySearch.addEventListener('input', () => this.renderDirectory());
        this.eventsSearch.addEventListener('input', () => this.renderEvents());
        this.marketplaceSearch.addEventListener('input', () => this.renderMarketplace());

        // Civic Issues Filter Handler
        this.issuesFilterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.issuesFilterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentIssueFilter = tab.getAttribute('data-filter');
                this.renderIssues();
            });
        });

        // Setup Modals triggers
        Object.keys(this.modals).forEach(key => {
            if (this.modalTriggers[key]) {
                this.modalTriggers[key].addEventListener('click', () => this.openModal(key));
            }
        });

        // Close Modals buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-close');
                document.getElementById(targetId).style.display = 'none';
            });
        });

        // Handle overlay click to close
        Object.values(this.modals).forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Submit form handlers
        document.getElementById('form-business').addEventListener('submit', (e) => this.handleNewBusiness(e));
        document.getElementById('form-event').addEventListener('submit', (e) => this.handleNewEvent(e));
        document.getElementById('form-issue').addEventListener('submit', (e) => this.handleNewIssue(e));
        document.getElementById('form-item').addEventListener('submit', (e) => this.handleNewItem(e));
    }

    // Toggle Theme Light / Dark
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        this.themeToggleBtn.innerHTML = nextTheme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }

    // Switch Visible Section
    switchView(viewId) {
        this.viewSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from header nav links
        document.querySelectorAll('#main-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-view') === viewId) {
                link.classList.add('active');
            }
        });

        const activeSection = document.getElementById(`${viewId}-view`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
    }

    // Modal Control
    openModal(modalKey) {
        const modal = this.modals[modalKey];
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeModal(modalKey) {
        const modal = this.modals[modalKey];
        if (modal) {
            modal.style.display = 'none';
            // Reset the form
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    // Form Submissions
    handleNewBusiness(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        const newBusiness = {
            id: Date.now(),
            name: data.get('name'),
            category: data.get('category'),
            desc: data.get('desc'),
            contact: data.get('contact')
        };
        this.businesses.unshift(newBusiness);
        this.saveState('th_businesses', this.businesses);
        this.renderDirectory();
        this.closeModal('business');
    }

    handleNewEvent(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        const newEvent = {
            id: Date.now(),
            title: data.get('title'),
            date: data.get('date'),
            location: data.get('location'),
            desc: data.get('desc'),
            goingCount: 1,
            userGoing: true
        };
        this.events.unshift(newEvent);
        this.saveState('th_events', this.events);
        this.renderEvents();
        this.closeModal('event');
    }

    handleNewIssue(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        const newIssue = {
            id: Date.now(),
            title: data.get('title'),
            location: data.get('location'),
            desc: data.get('desc'),
            status: 'open',
            time: 'Just now'
        };
        this.issues.unshift(newIssue);
        this.saveState('th_issues', this.issues);
        this.renderIssues();
        this.closeModal('issue');
    }

    handleNewItem(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        const newItem = {
            id: Date.now(),
            title: data.get('title'),
            price: data.get('price'),
            desc: data.get('desc'),
            contact: data.get('contact')
        };
        this.marketplace.unshift(newItem);
        this.saveState('th_marketplace', this.marketplace);
        this.renderMarketplace();
        this.closeModal('item');
    }

    // Event RSVP Toggling
    toggleRSVP(eventId) {
        this.events = this.events.map(event => {
            if (event.id === eventId) {
                const going = !event.userGoing;
                return {
                    ...event,
                    userGoing: going,
                    goingCount: going ? event.goingCount + 1 : event.goingCount - 1
                };
            }
            return event;
        });
        this.saveState('th_events', this.events);
        this.renderEvents();
    }

    // Dynamic rendering methods
    renderAll() {
        this.updateStats();
        this.renderAnnouncements();
        this.renderDirectory();
        this.renderEvents();
        this.renderIssues();
        this.renderMarketplace();
    }

    updateStats() {
        this.statBusinesses.textContent = this.businesses.length;
        this.statEvents.textContent = this.events.length;
        this.statIssues.textContent = this.issues.length;
        this.statMarketplace.textContent = this.marketplace.length;
    }

    renderAnnouncements() {
        this.announcementsList.innerHTML = this.announcements.map(ann => `
            <div class="announcement-item ${ann.isAlert ? 'alert' : ''}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${ann.title}</strong>
                    ${ann.isAlert ? '<span style="color:var(--danger); font-size:0.75rem;"><i class="fa-solid fa-triangle-exclamation"></i> Alert</span>' : ''}
                </div>
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.35rem;">${ann.content}</p>
                <div class="announcement-time">${ann.time}</div>
            </div>
        `).join('');
    }

    renderDirectory() {
        const query = this.directorySearch.value.toLowerCase();
        const filtered = this.businesses.filter(b => 
            b.name.toLowerCase().includes(query) || 
            b.category.toLowerCase().includes(query) || 
            b.desc.toLowerCase().includes(query)
        );

        this.directoryGrid.innerHTML = filtered.map(b => `
            <div class="card">
                <span class="card-tag" style="background:var(--accent-teal-glow); color:var(--accent-teal);">${b.category}</span>
                <h4 class="card-title">${b.name}</h4>
                <p class="card-desc">${b.desc}</p>
                <div class="card-meta">
                    <div class="meta-item"><i class="fa-solid fa-map-location-dot"></i> <span>${b.contact}</span></div>
                </div>
            </div>
        `).join('');
    }

    renderEvents() {
        const query = this.eventsSearch.value.toLowerCase();
        const filtered = this.events.filter(e => 
            e.title.toLowerCase().includes(query) || 
            e.desc.toLowerCase().includes(query) ||
            e.location.toLowerCase().includes(query)
        );

        this.eventsGrid.innerHTML = filtered.map(ev => `
            <div class="card">
                <span class="card-tag event-date-badge">EVENT</span>
                <h4 class="card-title">${ev.title}</h4>
                <div class="meta-item" style="font-size:0.85rem; color:var(--accent-teal); font-weight:500;"><i class="fa-solid fa-clock"></i> <span>${ev.date}</span></div>
                <div class="meta-item" style="font-size:0.85rem; color:var(--text-secondary);"><i class="fa-solid fa-location-dot"></i> <span>${ev.location}</span></div>
                <p class="card-desc" style="margin-top: 0.5rem;">${ev.desc}</p>
                <div class="card-meta" style="display:flex; align-items:center; justify-content:space-between;">
                    <div class="meta-item"><i class="fa-solid fa-circle-check"></i> <span>${ev.goingCount} attending</span></div>
                    <button class="btn btn-secondary btn-sm" onclick="app.toggleRSVP(${ev.id})" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
                        ${ev.userGoing ? '<i class="fa-solid fa-check text-success"></i> Going' : 'RSVP'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderIssues() {
        let filtered = this.issues;
        if (this.currentIssueFilter !== 'all') {
            filtered = this.issues.filter(i => i.status === this.currentIssueFilter);
        }

        this.issuesGrid.innerHTML = filtered.map(is => `
            <div class="card">
                <span class="card-tag status-badge status-${is.status}">${is.status.toUpperCase()}</span>
                <h4 class="card-title">${is.title}</h4>
                <div class="meta-item" style="font-size:0.85rem; color:var(--text-secondary);"><i class="fa-solid fa-map-pin"></i> <span>${is.location}</span></div>
                <p class="card-desc">${is.desc}</p>
                <div class="card-meta">
                    <div class="meta-item"><i class="fa-solid fa-clock"></i> <span>${is.time}</span></div>
                </div>
            </div>
        `).join('');
    }

    renderMarketplace() {
        const query = this.marketplaceSearch.value.toLowerCase();
        const filtered = this.marketplace.filter(m => 
            m.title.toLowerCase().includes(query) || 
            m.desc.toLowerCase().includes(query)
        );

        this.marketplaceGrid.innerHTML = filtered.map(item => `
            <div class="card">
                <span class="card-tag" style="background:var(--primary-glow); color:var(--primary); font-size: 0.85rem;">${item.price}</span>
                <h4 class="card-title">${item.title}</h4>
                <p class="card-desc">${item.desc}</p>
                <div class="card-meta">
                    <div class="meta-item"><i class="fa-solid fa-address-book"></i> <span>${item.contact}</span></div>
                </div>
            </div>
        `).join('');
    }
}

// Instantiate global app
window.app = new TownHubApp();
