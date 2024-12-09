let socket;

document.addEventListener('DOMContentLoaded', () => {
    showSection('home');
    setupMenuToggle();
    setupChat();
    setupQuestionDetails();
    initializeApp();
    initializeSocket();
});

function initializeSocket() {
    // In a real application, you would connect to your actual server
    socket = io('https://your-server-url.com');

    socket.on('newQuestion', (question) => {
        addQuestionToList(question);
    });
}

function showSection(id) {
    const sections = document.querySelectorAll('main.section');
    sections.forEach((section) => {
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(id);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        console.error(`Section with id "${id}" not found`);
    }

    // Update active state in navigation
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
        }
    });
}

function setupMenuToggle() {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', navMenu.classList.contains('active'));
    });
}

function postQuestion() {
    const questionInput = document.getElementById('random-question');
    const question = questionInput.value.trim();
    if (question !== "") {
        const newQuestion = {
            id: Date.now(),
            question: question,
            author: "Anonymous", // In a real app, this would be the logged-in user
            timestamp: new Date().getTime()
        };

        // Add the question to the local list immediately
        addQuestionToList(newQuestion);

        // Clear the input field
        questionInput.value = "";

        // Show the announcements section
        showSection('announcements');

        // Emit the new question to the server (if online)
        if (socket && socket.connected) {
            socket.emit('postQuestion', newQuestion);
        } else {
            console.log('Offline mode: Question saved locally');
        }
    } else {
        alert("Please enter a question.");
    }
}

function addQuestionToList(questionData) {
    const announcementsList = document.getElementById('announcements-list');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    questionDiv.innerHTML = `
        <h3>${questionData.question}</h3>
        <p>Posted by: ${questionData.author}</p>
        <p>Posted ${formatTimestamp(questionData.timestamp)}</p>
    `;
    questionDiv.onclick = () => showQuestionDetails(questionData.question, questionData.timestamp);
    announcementsList.insertBefore(questionDiv, announcementsList.firstChild);
}

function formatTimestamp(timestamp) {
    const now = new Date();
    const posted = new Date(timestamp);
    const diff = now - posted;

    if (diff < 60000) {
        return 'just now';
    } else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
        return `${Math.floor(diff / 3600000)} hours ago`;
    }
}

function showQuestionDetails(question, timestamp) {
    showSection('question-details');
    document.getElementById('question-title').textContent = question;
    updatePostedTime(timestamp);
    setupQuestionDetailsListeners();
}

function updatePostedTime(timestamp) {
    const postedTime = document.getElementById('posted-time');
    postedTime.textContent = `Posted ${formatTimestamp(timestamp)}`;
}

function setupQuestionDetailsListeners() {
    document.getElementById('knowledge-input').value = '';
    document.getElementById('answer-section').style.display = 'block';
    document.getElementById('chat-section').style.display = 'none';
    document.getElementById('meeting-section').style.display = 'none';
}

function submitKnowledge() {
    const knowledgeInput = document.getElementById('knowledge-input');
    const knowledge = knowledgeInput.value.trim();
    if (!knowledge) {
        alert('Please share your knowledge about the topic before proceeding.');
        return;
    }
    document.getElementById('answer-section').style.display = 'none';
    document.getElementById('chat-section').style.display = 'block';
    displayQuestionMessage('System', 'Your knowledge has been shared with the host. Please wait for their response.', 'system');
    setTimeout(() => {
        displayQuestionMessage('Host', 'Hello! I\'ve reviewed your knowledge about the topic. Let\'s discuss it further.', 'received');
    }, 2000);
}

function sendQuestionMessage() {
    const chatInput = document.getElementById('question-chat-input');
    const message = chatInput.value.trim();
    if (!message) return;
    displayQuestionMessage('You', message, 'sent');
    chatInput.value = '';
    setTimeout(() => {
        if (document.querySelectorAll('#question-chat-messages .chat-message').length > 4) {
            displayQuestionMessage('Host', 'Great! I can see you have good knowledge about this topic. I\'m approving your meeting access.', 'received');
            setTimeout(() => {
                document.getElementById('meeting-section').style.display = 'block';
            }, 1000);
        } else {
            displayQuestionMessage('Host', 'Can you tell me more about your experience with this topic?', 'received');
        }
    }, 1500);
}

function displayQuestionMessage(sender, text, type) {
    const chatMessages = document.getElementById('question-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="sender">${sender}</span>
            <span class="time">${time}</span>
        </div>
        <div class="message-content">${text}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function joinQuestionMeeting() {
    const question = document.getElementById('question-title').textContent;
    showSection('video-call');
    startVideoCall(`Meeting_${new Date().getTime()}_${question.substring(0, 20)}`);
}

function generateInviteMeeting() {
    const emailInput = document.getElementById('invite-email');
    const emails = emailInput.value.trim();
    if (emails !== "") {
        alert(`Meeting invite sent to:\n${emails}`);
        showSection('video-call');
        startVideoCall("InviteMeeting_" + Date.now());
        emailInput.value = "";
    } else {
        alert("Please enter email addresses.");
    }
}

function setupChat() {
    const sendButton = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (message) {
        displayMessage("You", message, "sent");
        input.value = "";
        // Simulate receiving a response (for demonstration)
        setTimeout(() => displayMessage("Peer", "Received: " + message, "received"), 1000);
    }
}

function displayMessage(sender, message, type) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `
        <strong>${sender}</strong> <span class="timestamp">${timestamp}</span><br>
        ${message}
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function startVideoCall(roomName) {
    const domain = "meet.jit.si";
    const options = {
        roomName,
        parentNode: document.querySelector('#jitsi-container'),
        width: '100%',
        height: '100%',
        configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true
        },
        interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                'security'
            ],
        },
    };
    const api = new JitsiMeetExternalAPI(domain, options);
    api.addEventListeners({
        videoConferenceJoined: () => {
            console.log("User has joined the conference");
            document.querySelector('.chat-container').style.display = 'block';
        },
        videoConferenceLeft: () => {
            console.log("User has left the conference");
            document.querySelector('.chat-container').style.display = 'none';
        },
    });
}

function initializeApp() {
    fetchInitialData();
    setupAdditionalListeners();
}

function fetchInitialData() {
    // Simulating an API call to fetch initial data
    setTimeout(() => {
        const sampleData = [
            { id: 1, question: "What is the capital of France?", author: "User123", timestamp: Date.now() - 3600000 },
            { id: 2, question: "How does photosynthesis work?", author: "BiologyFan", timestamp: Date.now() - 7200000 },
            { id: 3, question: "Explain the theory of relativity.", author: "PhysicsNerd", timestamp: Date.now() - 10800000 }
        ];
        populateAnnouncements(sampleData);
    }, 1000);
}

function populateAnnouncements(data) {
    const announcementsList = document.getElementById('announcements-list');
    announcementsList.innerHTML = ''; // Clear existing announcements
    data.forEach(item => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
            <h3>${item.question}</h3>
            <p>Posted by: ${item.author}</p>
            <p>${formatTimestamp(item.timestamp)}</p>
        `;
        questionDiv.onclick = () => showQuestionDetails(item.question, item.timestamp);
        announcementsList.appendChild(questionDiv);
    });
}

function setupAdditionalListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            showSection('random-meeting');
        }
    });
    // Add event listener for Enter key in question chat input
    document.getElementById('question-chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendQuestionMessage();
        }
    });
}

// Initialize the application
window.addEventListener('load', initializeApp);

