// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Controleer op welke pagina we zijn
    if (document.getElementById('playersForm')) {
        // We zijn op index.html
        initIndexPage();
    } else if (document.getElementById('rikker-selectie')) {
        // We zijn op game.html
        initGamePage();
    }
});

function initIndexPage() {
    const playersForm = document.getElementById('playersForm');
    playersForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Voorkom standaard formulierverzending
        const players = {
            player1: document.getElementById('player1').value,
            player2: document.getElementById('player2').value,
            player3: document.getElementById('player3').value,
            player4: document.getElementById('player4').value,
            player5: document.getElementById('player5').value
        };
        const scores = {
            score1: parseFloat(document.getElementById('score1').value) || 0,
            score2: parseFloat(document.getElementById('score2').value) || 0,
            score3: parseFloat(document.getElementById('score3').value) || 0,
            score4: parseFloat(document.getElementById('score4').value) || 0,
            score5: parseFloat(document.getElementById('score5').value) || 0
        };

        // Sla spelersnamen en scores op in localStorage
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('scores', JSON.stringify(scores));

        // Navigeer naar de spelpagina
        window.location.href = 'game.html';
    });
}

function initGamePage() {
    // Initialisatie van het spel
    const players = JSON.parse(localStorage.getItem('players')) || {};
    const initialScores = JSON.parse(localStorage.getItem('scores')) || {};
    let scores = {};
    let lastScores = {};
    let spelerRikt = '';
    let spelerMaat = '';
    let lastSpelerRikt = '';
    let lastSpelerMaat = '';
    let inactivePlayer = '';
    let lastInactivePlayer = '';
    let dealerIndex = 0;
    let ronde = 1;

    // DOM-elementen cachen
    const rikkerSelectie = document.getElementById('rikker-selectie');
    const maatSelectie = document.getElementById('maat-selectie');
    const selectedRikker = document.getElementById('selected-rikker');
    const selectedMaat = document.getElementById('selected-maat');
    const spelvormSelect = document.getElementById('spelvorm');
    const slagenInput = document.getElementById('slagen');
    const berekenButton = document.getElementById('bereken-button');
    const pasButton = document.getElementById('pas-button');
    const scoreOverview = document.getElementById('score-overview');
    const confirmUndo = document.getElementById('confirm-undo');
    const undoButton = document.getElementById('undo-button');
    const confirmReset = document.getElementById('confirm-reset');
    const resetButton = document.getElementById('reset-button');
    const maatSection = document.getElementById('maat-section');

    const aantalSpelers = Object.values(players).filter(name => name).length;
    const playerIds = Object.keys(players).filter(key => players[key]);

    // Scores initialiseren
    playerIds.forEach((id, index) => {
        scores[id] = initialScores[`score${index + 1}`] || 0;
    });

    // Spelerknoppen genereren
    generatePlayerButtons();
    // Spelvormen initialiseren
    initSpelvormOptions();
    // Event Listeners toevoegen
    addEventListeners();
    // Willekeurig een inactieve speler selecteren (alleen bij 5 spelers)
    if (aantalSpelers === 5) {
        setInactivePlayer(getRandomInactivePlayer());
    }
    // Dealer initialiseren
    dealerIndex = 0; // Start bij de eerste speler
    updateDealerButton();
    // Score-overzicht bijwerken
    updateScoreOverview();

    function generatePlayerButtons() {
        playerIds.forEach(id => {
            // Knoppen voor rikker-selectie
            let rikkerButton = document.createElement('button');
            rikkerButton.classList.add('player-button');
            rikkerButton.textContent = players[id];
            rikkerButton.dataset.playerId = id;
            rikkerButton.addEventListener('click', () => selectPlayer(id));
            rikkerSelectie.appendChild(rikkerButton);

            // Knoppen voor maat-selectie
            let maatButton = document.createElement('button');
            maatButton.classList.add('player-button');
            maatButton.textContent = players[id];
            maatButton.dataset.playerId = id;
            maatButton.addEventListener('click', () => selectMaat(id));
            maatSelectie.appendChild(maatButton);
        });
    }

    function initSpelvormOptions() {
        const spelvormen = [
            "Rikken",
            "3 Azen",
            "8 Alleen",
            "9 Alleen",
            "10 Alleen",
            "11 Alleen",
            "12 Alleen",
            "Solo",
            "Piek",
            "Misere",
            "Open Piek",
            "Open Misere",
            "Open Solo"
        ];

        spelvormen.forEach(spelvorm => {
            let option = document.createElement('option');
            option.value = spelvorm;
            option.textContent = spelvorm;
            spelvormSelect.appendChild(option);
        });
    }

    function addEventListeners() {
        spelvormSelect.addEventListener('change', toggleOptions);
        berekenButton.addEventListener('click', calculateScore);
        pasButton.addEventListener('click', passRound);
        confirmUndo.addEventListener('click', toggleUndoButton);
        undoButton.addEventListener('click', undoLastScore);
        confirmReset.addEventListener('click', toggleResetButton);
        resetButton.addEventListener('click', resetScores);
    }

    function getRandomInactivePlayer() {
        const randomIndex = Math.floor(Math.random() * playerIds.length);
        return playerIds[randomIndex];
    }

    function setInactivePlayer(playerId) {
        inactivePlayer = playerId;
        updateButtonStyles();
    }

    function updateDealerButton() {
        document.querySelectorAll('.player-button').forEach(button => {
            button.classList.remove('dealer');
        });

        const dealerId = playerIds[dealerIndex % playerIds.length];
        document.querySelectorAll(`.player-button[data-player-id="${dealerId}"]`).forEach(button => {
            button.classList.add('dealer');
        });

        dealerIndex++;
    }

    function updateButtonStyles() {
        // Knoppen voor rikker-selectie
        document.querySelectorAll('#rikker-selectie .player-button').forEach(button => {
            const playerId = button.dataset.playerId;
            button.classList.remove('selected', 'inactive');
            button.disabled = false;
            if (playerId === spelerRikt) {
                button.classList.add('selected');
            }
            if (playerId === inactivePlayer) {
                button.classList.add('inactive');
                button.disabled = true;
            }
        });

        // Knoppen voor maat-selectie
        document.querySelectorAll('#maat-selectie .player-button').forEach(button => {
            const playerId = button.dataset.playerId;
            button.classList.remove('selected', 'inactive');
            button.disabled = false;
            if (playerId === spelerMaat) {
                button.classList.add('selected');
            }
            if (playerId === inactivePlayer || playerId === spelerRikt) {
                button.classList.add('inactive');
                button.disabled = true;
            }
        });
    }

    function selectPlayer(playerId) {
        if (playerId === spelerRikt) {
            spelerRikt = '';
            selectedRikker.textContent = 'Geselecteerde rikker: Geen';
        } else {
            spelerRikt = playerId;
            selectedRikker.textContent = `Geselecteerde rikker: ${players[playerId]}`;
            // Reset maat als de rikker verandert
            spelerMaat = '';
            selectedMaat.textContent = 'Geselecteerde maat: Geen';
        }
        updateButtonStyles();
    }

    function selectMaat(playerId) {
        if (!spelerRikt) {
            alert('Selecteer eerst een rikker.');
            return;
        }
        if (playerId === spelerMaat) {
            spelerMaat = '';
            selectedMaat.textContent = 'Geselecteerde maat: Geen';
        } else {
            spelerMaat = playerId;
            selectedMaat.textContent = `Geselecteerde maat: ${players[playerId]}`;
        }
        updateButtonStyles();
    }

    function toggleOptions() {
        const spelvorm = spelvormSelect.value;
        if (spelvorm === 'Rikken' || spelvorm === '3 Azen') {
            maatSection.style.display = 'block';
        } else {
            maatSection.style.display = 'none';
            spelerMaat = '';
            selectedMaat.textContent = 'Geselecteerde maat: Geen';
            updateButtonStyles();
        }
    }

    function calculateScore() {
        const spelvorm = spelvormSelect.value;
        const slagen = parseInt(slagenInput.value);

        if (!spelerRikt) {
            alert('Selecteer een rikker.');
            return;
        }

        if ((spelvorm === 'Rikken' || spelvorm === '3 Azen') && !spelerMaat) {
            alert('Selecteer een maat voor deze spelvorm!');
            return;
        }

        if (isNaN(slagen) || slagen < 0 || slagen > 13) {
            alert('Voer een geldig aantal slagen in (0-13).');
            return;
        }

        // Sla huidige status op voor ongedaan maken
        lastScores = { ...scores };
        lastSpelerRikt = spelerRikt;
        lastSpelerMaat = spelerMaat;
        lastInactivePlayer = inactivePlayer;

        const rikkerId = spelerRikt;
        const maatId = spelerMaat;
        const actieveSpelers = playerIds.filter(id => id !== rikkerId && id !== maatId && id !== inactivePlayer);

        let puntenRikker = 0;
        let puntenMaat = 0;
        let puntenVerliezers = 0;

        // Scoreberekening per spelvorm
        if (spelvorm === 'Rikken') {
            const standaardWinst = 2;
            const standaardVerlies = -3;
            const extraWinstPerSlag = 2;
            const extraVerliesPerSlag = -3;
            const minimumSlagen = 8;

            if (slagen >= minimumSlagen) {
                // Win scenario
                let extraPunten = (slagen - minimumSlagen) * extraWinstPerSlag;
                puntenRikker = standaardWinst + extraPunten;

                if (slagen === 13) {
                    puntenRikker *= 2;
                }

                puntenVerliezers = -(puntenRikker + (spelerMaat ? puntenRikker : 0)) / actieveSpelers.length;
                if (spelerMaat) {
                    puntenMaat = puntenRikker;
                }
            } else {
                // Verlies scenario
                let tekort = (minimumSlagen - slagen) * extraVerliesPerSlag;
                puntenRikker = (standaardVerlies + tekort) * -2; // Verlies van de rikker vermenigvuldigd met 2

                // Punten van de rikker verdelen over de actieve spelers
                puntenVerliezers = puntenRikker / actieveSpelers.length;
                puntenRikker = -puntenRikker; // Rikker betaalt het dubbele verlies
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            if (spelerMaat) {
                scores[maatId] += puntenMaat;
            }
            actieveSpelers.forEach(id => {
                scores[id] += puntenVerliezers;
            });
        } else if (spelvorm === '3 Azen') {
            const standaardWinst = 4;
            const standaardVerlies = -6;
            const extraWinstPerSlag = 4;
            const extraVerliesPerSlag = -6;
            const minimumSlagen = 8;

            if (slagen >= minimumSlagen) {
                // Win scenario
                let extraPunten = (slagen - minimumSlagen) * extraWinstPerSlag;
                puntenRikker = standaardWinst + extraPunten;

                if (slagen === 13) {
                    puntenRikker *= 2;
                }

                puntenVerliezers = -(puntenRikker + (spelerMaat ? puntenRikker : 0)) / actieveSpelers.length;
                if (spelerMaat) {
                    puntenMaat = puntenRikker;
                }
            } else {
                // Verlies scenario
                let tekort = (minimumSlagen - slagen) * extraVerliesPerSlag;
                puntenRikker = (standaardVerlies + tekort);
                puntenMaat = puntenRikker;

                // Punten van de rikker en maat verdelen over de actieve spelers
                puntenVerliezers = -(puntenRikker + puntenMaat) / actieveSpelers.length;
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            if (spelerMaat) {
                scores[maatId] += puntenMaat;
            }
            actieveSpelers.forEach(id => {
                scores[id] += puntenVerliezers;
            });
        } else if (spelvorm.endsWith('Alleen')) {
            // Bepaal de minimumslagen en standaardpunten op basis van de spelvorm
            const minimumSlagen = parseInt(spelvorm.split(' ')[0]);
            const standaardWinst = (minimumSlagen - 5) * 3;
            const standaardVerlies = -((minimumSlagen - 5) * 3 + 3);
            const extraWinstPerSlag = 3;
            const extraVerliesPerSlag = -3;

            if (slagen >= minimumSlagen) {
                // Win scenario
                let extraPunten = (slagen - minimumSlagen) * extraWinstPerSlag;
                puntenRikker = standaardWinst + extraPunten;
            } else {
                // Verlies scenario
                let tekort = (minimumSlagen - slagen) * extraVerliesPerSlag;
                puntenRikker = standaardVerlies + tekort;
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            actieveSpelers.forEach(id => {
                scores[id] += -puntenRikker / actieveSpelers.length;
            });
        } else if (spelvorm === 'Solo') {
            const standaardWinst = 24;
            const standaardVerlies = -24;
            const minimumSlagen = 13;

            if (slagen === minimumSlagen) {
                // Win scenario
                puntenRikker = standaardWinst;
            } else {
                // Verlies scenario
                puntenRikker = standaardVerlies;
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            actieveSpelers.forEach(id => {
                scores[id] += -puntenRikker / actieveSpelers.length;
            });
        } else if (spelvorm === 'Misere') {
            const standaardWinst = 9;
            const standaardVerlies = -12;
            const minimumSlagen = 0;

            if (slagen === minimumSlagen) {
                // Win scenario
                puntenRikker = standaardWinst;
            } else {
                // Verlies scenario
                puntenRikker = standaardVerlies;
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            actieveSpelers.forEach(id => {
                scores[id] += -puntenRikker / actieveSpelers.length;
            });
        } else if (spelvorm === 'Piek') {
            const standaardWinst = 12;
            const standaardVerlies = -15;
            const minimumSlagen = 1;

            if (slagen >= minimumSlagen) {
                // Win scenario
                puntenRikker = standaardWinst;
            } else {
                // Verlies scenario
                puntenRikker = standaardVerlies;
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            actieveSpelers.forEach(id => {
                scores[id] += -puntenRikker / actieveSpelers.length;
            });
        } else if (spelvorm === 'Open Misere') {
            const standaardWinst = 18;
            const standaardVerlies = -21;
            const minimumSlagen = 0;

            if (slagen === minimumSlagen) {
                // Win scenario
                puntenRikker = standaardWinst;
            } else {
                // Verlies scenario
                puntenRikker = standaardVerlies;
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            actieveSpelers.forEach(id => {
                scores[id] += -puntenRikker / actieveSpelers.length;
            });
        } else if (spelvorm === 'Open Piek') {
            const standaardWinst = 21;
            const standaardVerlies = -24;
            const minimumSlagen = 1;

            if (slagen >= minimumSlagen) {
                // Win scenario
                puntenRikker = standaardWinst;
            } else {
                // Verlies scenario
                puntenRikker = standaardVerlies;
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            actieveSpelers.forEach(id => {
                scores[id] += -puntenRikker / actieveSpelers.length;
            });
        } else if (spelvorm === 'Open Solo') {
            const standaardWinst = 36;
            const standaardVerlies = -36;
            const minimumSlagen = 13;

            if (slagen === minimumSlagen) {
                // Win scenario
                puntenRikker = standaardWinst;
            } else {
                // Verlies scenario
                puntenRikker = standaardVerlies;
            }

            // Punten toewijzen
            scores[rikkerId] += puntenRikker;
            actieveSpelers.forEach(id => {
                scores[id] += -puntenRikker / actieveSpelers.length;
            });
        }

        // Update de UI
        updateScoreOverview();
        clearPlayerSelection();
        updateDealerButton();
        if (aantalSpelers === 5) {
            verspringInactivePlayer();
        }
        resetForm();
    }

    function updateScoreOverview() {
        scoreOverview.innerHTML = '';
        playerIds.forEach(id => {
            const playerName = players[id];
            const playerScore = scores[id];
            const netScore = playerScore - (initialScores[`score${playerIds.indexOf(id) + 1}`] || 0);
            const netScoreClass = netScore >= 0 ? 'net-score-positive' : 'net-score-negative';
            const scoreElement = document.createElement('p');
            scoreElement.innerHTML = `${playerName}: ${playerScore} | <span class="${netScoreClass}">${netScore}</span>`;
            scoreOverview.appendChild(scoreElement);
        });
    }

    function clearPlayerSelection() {
        spelerRikt = '';
        spelerMaat = '';
        selectedRikker.textContent = 'Geselecteerde rikker: Geen';
        selectedMaat.textContent = 'Geselecteerde maat: Geen';
        updateButtonStyles();
    }

    function verspringInactivePlayer() {
        const currentIndex = playerIds.indexOf(inactivePlayer);
        const nextIndex = (currentIndex + 1) % playerIds.length;
        setInactivePlayer(playerIds[nextIndex]);
    }

    function resetForm() {
        spelvormSelect.value = 'Rikken';
        slagenInput.value = '';
        toggleOptions();
    }

    function passRound() {
        updateDealerButton();
        if (aantalSpelers === 5) {
            verspringInactivePlayer();
        }
        ronde++;
        updateScoreOverview();
    }

    function toggleUndoButton() {
        undoButton.disabled = !confirmUndo.checked;
    }

    function undoLastScore() {
        scores = { ...lastScores };
        spelerRikt = lastSpelerRikt;
        spelerMaat = lastSpelerMaat;
        inactivePlayer = lastInactivePlayer;
        updateScoreOverview();
        updateButtonStyles();
        confirmUndo.checked = false;
        undoButton.disabled = true;
    }

    function toggleResetButton() {
        resetButton.disabled = !confirmReset.checked;
    }

    function resetScores() {
        if (confirm('Weet je zeker dat je alle scores wilt resetten?')) {
            scores = {};
            playerIds.forEach(id => {
                scores[id] = initialScores[`score${playerIds.indexOf(id) + 1}`] || 0;
            });
            ronde = 1;
            updateScoreOverview();
            clearPlayerSelection();
            confirmReset.checked = false;
            resetButton.disabled = true;
            dealerIndex = 0;
            updateDealerButton();
        }
    }
}
