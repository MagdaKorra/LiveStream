const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(__dirname));

// Główna strona
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Stan gry (przechowywany w pamięci serwera)
let gameState = {
    team1Name: 'zawodnik KSBK',
    team2Name: 'zawodnik HUBAL',
    team1Logo: 'https://ekstraliga.pzbad.pl/wp-content/uploads/2023/10/logo-kobierzyce.png',
    team2Logo: './logo-sp-32-uks-hubal.png',
    score1: 0,
    score2: 0,
    sets1: 0,
    sets2: 0,
    lastScorer: 1,
    setHistory: []
};
// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('✅ Nowy klient połączony');
    clients.add(ws);

    // Wyślij aktualny stan do nowego klienta
    ws.send(JSON.stringify({
        type: 'init',
        state: gameState
    }));

    // Obsługa wiadomości od klienta
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'update') {
                // Zaktualizuj stan gry
                gameState = { ...data.state };
                
                // Rozgłoś do wszystkich klientów
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'update',
                            state: gameState
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Błąd przetwarzania wiadomości:', error);
        }
    });

    // Usuń klienta po rozłączeniu
    ws.on('close', () => {
        console.log('❌ Klient rozłączony');
        clients.delete(ws);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🏸  BADMINTON SCORER - SERVER DZIAŁA!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📺  Panel Operatora: http://localhost:${PORT}`);
    console.log(`📺  Widok OBS:       http://localhost:${PORT}?display=true`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎮 Jak używać:');
    console.log('   1. Panel operatora: Otwórz http://localhost:3000');
    console.log('   2. W OBS: Dodaj Browser Source z linkiem');
    console.log('      http://localhost:3000?display=true');
    console.log('   3. Klikaj przyciski - zmiany są natychmiastowe w OBS! ⚡');
    console.log('═══════════════════════════════════════════════════════\n');
});