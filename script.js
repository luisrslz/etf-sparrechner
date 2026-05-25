function berechneGesamtStSatz(input) {

    const abgSteuer = 0.25;
    const soli = 0.055;
    if (input.kirchensteuerAktiv) {
        const effKeSt = abgSteuer / (1 + abgSteuer * input.kirchensteuersatz);
        return effKeSt * (1 + soli + input.kirchensteuersatz);
    }
    return abgSteuer * (1 + soli);
}

function berechneNettoEndkapital(input, bruttoEndkapital, eingezahlt, gesamtStSatz) {

    const gesamtGewinn = bruttoEndkapital - eingezahlt;
    const steuerfreiGesamt = input.sparerpauschbetrag * input.laufzeit; // stark vereinfacht...
    const steuerpflichtig = Math.max(0, gesamtGewinn - steuerfreiGesamt);
    const steuer = input.steuerAktiv ? steuerpflichtig * (1 - input.tfs) * gesamtStSatz : 0;

    return bruttoEndkapital - steuer;
}

function berechneBruttoEndkapital(input) {

    // (hier netto im Sinne von ohne TER aber vor steuern)
    const nettoRendite = input.bruttoRendite - input.ter;

    const r = nettoRendite / 12; // monatlich

    let bruttoEndkapital =  input.startkapital;

    for (let jahr = 0; jahr < input.laufzeit; jahr++) {
        const rate = input.monatlicheEinzahlung * Math.pow(1 + input.erhoehung, jahr);

        for (let monat = 0; monat < 12; monat++) {
            bruttoEndkapital = bruttoEndkapital * (1 + r) + rate;
        }
    }

    return bruttoEndkapital;
}

function berechneEingezahlt(input) {

    let eingezahlt = input.startkapital; // startpunkt ist initiale einzahlung

    for (let jahr = 0; jahr < input.laufzeit; jahr++) {
        const rate = input.monatlicheEinzahlung * Math.pow(1 + input.erhoehung, jahr);
        eingezahlt += rate * 12;
    }

    return eingezahlt;
}

// Sparratenverlaufs-Balken
function zeichneBalken(input) {

    const verlaufContainer = document.getElementById('sparraten-verlauf');
    verlaufContainer.innerHTML = '';

    const balken = input.laufzeit < 5 ? input.laufzeit : 5;
    const maxRate = input.monatlicheEinzahlung * Math.pow(1 + input.erhoehung, input.laufzeit - 1);

    for (let i = 0; i < balken; i++) {
        const jahr = i === 0 ? 1 : Math.ceil((input.laufzeit / (balken - 1)) * i);
        const rate = input.monatlicheEinzahlung * Math.pow(1 + input.erhoehung, jahr - 1);
        const breite = (rate / maxRate) * 100;

        verlaufContainer.innerHTML += `
            <div class="verlauf-row">
                <span class="verlauf-label">J${jahr}</span>
                <div class="verlauf-bar-wrap">
                    <div class="verlauf-bar" style="width: ${breite}%"></div>
                </div>
                <span class="verlauf-wert">${Math.round(rate)} €</span>
            </div>
        `;
    }
}

// schöner ausgeben
function formatEuro(wert) {

    if (wert >= 1_000_000) {
        const mio = wert / 1_000_000;
        return mio.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Mio. €';
    }

    return wert.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
}

function formatFaktor(wert) {

    return wert.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + '×';
}

function formatDisplay(wert, einheit) {

    if (einheit === '€') return Number(wert).toLocaleString('de-DE') + ' €';
    if (einheit === 'Jahre') return wert + ' Jahre';
    if (einheit === '%') return wert + ' %';

    return wert;
}

// aktualisiert info panel im eingabebereich
function infosAktualisieren(input, gesamtStSatz) {

    // nettorendite info aktualisieren
    const nettoRendite = input.bruttoRendite - input.ter;
    document.getElementById("nettorendite-display").textContent = formatDisplay((nettoRendite * 100).toFixed(2), "%");

    // für subtitle inflation im ergebnis kaufkraft
    document.getElementById('inflationsrate-display').textContent = (input.inflation * 100).toFixed(1); 

    // realrendite info aktualisieren
    const realRendite = nettoRendite - input.inflation;
    document.getElementById("realrendite-display").textContent = formatDisplay((realRendite * 100).toFixed(2), "%");

    const nachTFS = gesamtStSatz * (1 - input.tfs);
    if (input.steuerAktiv) {
        document.getElementById('gesamt-steuersatz').textContent = (gesamtStSatz * 100).toFixed(3) + ' %';
        document.getElementById('nach-tfs').textContent = (nachTFS * 100).toFixed(3) + ' %';
    } else {
        document.getElementById('gesamt-steuersatz').textContent = '-';
        document.getElementById('nach-tfs').textContent = '-';
    }
}

// einlesen aller inputs
function leseInputs() {

    const erhoehungAktiv = document.getElementById("sparraten-erhoehung").checked; // für erhoehung

    return {
        startkapital:        parseFloat(document.getElementById("startkapital-num").value),
        monatlicheEinzahlung: parseFloat(document.getElementById("sparrate-num").value),
        laufzeit:            parseInt(document.getElementById("laufzeit-num").value),
        erhoehung:           erhoehungAktiv
                                ? parseFloat(document.getElementById("erhoehung-num").value) / 100
                                : 0,
        bruttoRendite:       parseFloat(document.getElementById("bruttorendite-num").value) / 100,
        ter:                 parseFloat(document.getElementById("ter-kosten-num").value) / 100,
        inflation:           parseFloat(document.getElementById("inflation-num").value) / 100,
        steuerAktiv:         document.getElementById('abgeltungssteuer').checked,
        tfs:                 parseFloat(document.getElementById('etf-typ').value),
        sparerpauschbetrag:  parseFloat(document.querySelector('#sparerpauschbetrag-buttons .pill-btn.active').dataset.value),
        kirchensteuerAktiv:  document.getElementById('kirchensteuer').checked,
        kirchensteuersatz:   parseFloat(document.querySelector('#kirchensteuersatz-buttons .pill-btn.active').dataset.value),
    };
}

function main() {

    const input = leseInputs();
    
    const bruttoEndkapital = berechneBruttoEndkapital(input);
    const eingezahlt = berechneEingezahlt(input);

    const gesamtStSatz = berechneGesamtStSatz(input);
    const nettoEndkapital = berechneNettoEndkapital(input, bruttoEndkapital, eingezahlt, gesamtStSatz);

    const kaufkraft = nettoEndkapital / Math.pow(1 + input.inflation, input.laufzeit);

    const faktor = kaufkraft / eingezahlt;

    infosAktualisieren(input, gesamtStSatz);
    zeichneBalken(input);

    // im result panel ausgeben, später in funktion packen
    document.getElementById('endkapital-brutto').textContent = formatEuro(bruttoEndkapital);
    document.getElementById('endkapital-netto').textContent = formatEuro(nettoEndkapital);
    document.getElementById('kaufkraft').textContent = formatEuro(kaufkraft);
    document.getElementById('kapitalfaktor').textContent = formatFaktor(faktor);
}

// listener für slider + number-inputs
document.querySelectorAll('.input-group').forEach(gruppe => {

    const einheit = gruppe.dataset.einheit;
    const slider = gruppe.querySelector('input[type="range"]');
    const num = gruppe.querySelector('input[type="number"]')
    const display = gruppe.querySelector('.input-value-display');

    const max = parseFloat(gruppe.dataset.max) || Infinity; // wenn nichts festgelegt ist kein Limit

    if (!slider || !num) return; // -> dropdown crasht das skript sonst

    slider.addEventListener('input', () => {
        num.value = slider.value;
        display.textContent = formatDisplay(slider.value, einheit);
        main();
    });

    num.addEventListener('input', () => {
        if (parseFloat(num.value) > max) {
            num.value = max;
        }
        slider.value = num.value;
        display.textContent = formatDisplay(num.value, einheit);
        main();
    });

});

//listener für tab-buttons
document.querySelectorAll('.tab-btn').forEach(btn => {

    btn.addEventListener('click', () => {
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');

        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// listener für theme-toggle
document.getElementById('theme-toggle').addEventListener('click', () => {

    const html = document.documentElement;
    if (html.dataset.theme === 'light') {
        html.dataset.theme = 'dark';
    } else {
        html.dataset.theme = 'light';
    }   
});

// listener für toggle, die slider aktivieren/deaktivieren
document.querySelectorAll('input[type="checkbox"][data-controls]').forEach(toggle => {

    const target = document.getElementById(toggle.dataset.controls);

    function updateToggle() {
        target.classList.toggle('disabled', !toggle.checked); 
        main(); // -> hier nochmal aufrufen
    }

    toggle.addEventListener('change', updateToggle);
    updateToggle();
});

/* listener für pill-buttons */
document.querySelectorAll('.pill-buttons').forEach(gruppe => {

    gruppe.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            gruppe.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            main();
        });

    });
});

// etf-typ ändert sich -> neu rechnen
document.getElementById('etf-typ').addEventListener('change', main);

main(); // garantieren