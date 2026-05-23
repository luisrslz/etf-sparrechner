
function calculate() {
    const startkapital = parseFloat(document.getElementById("startkapital-num").value);
    const monatlicheEinzahlung = parseFloat(document.getElementById("sparrate-num").value);
    const laufzeit = parseInt(document.getElementById("laufzeit-num").value);
    const erhoehungAktiv = document.getElementById("sparraten-erhoehung").checked;
    const erhoehung = erhoehungAktiv ? parseFloat(document.getElementById("erhoehung-num").value) / 100
                                     : 0;
    const bruttoRendite = parseFloat(document.getElementById("bruttorendite-num").value) / 100;
    
    // bruttoRendite - TER =
    const nettoRendite = bruttoRendite - (parseFloat(document.getElementById("ter-kosten-num").value) / 100);

    console.log(bruttoRendite)

    const r = nettoRendite / 12; // monatlich

    let kapital =  startkapital;
    let eingezahlt = startkapital;

    for (let jahr = 0; jahr < laufzeit; jahr++) {
        const rate = monatlicheEinzahlung * Math.pow(1 + erhoehung, jahr);
        eingezahlt += rate * 12;

        for (let monat = 0; monat < 12; monat++) {
            kapital = kapital * (1 + r) + rate;
        }
    }

    const endkapital = kapital;
    const faktor = endkapital / eingezahlt;


    // ausgeben
    document.getElementById('endkapital-brutto').textContent = formatEuro(endkapital);
    document.getElementById('kapitalfaktor').textContent = formatFaktor(faktor);

    // später
    document.getElementById('endkapital-netto').textContent = '-';
    document.getElementById('kaufkraft').textContent = '-';

    // Sparratenverlaufs-Balken
    const verlaufContainer = document.getElementById('sparraten-verlauf');
    verlaufContainer.innerHTML = '';

    const balken = laufzeit < 5 ? laufzeit : 5;
    const maxRate = monatlicheEinzahlung * Math.pow(1 + erhoehung, laufzeit - 1);

    for (let i = 0; i < balken; i++) {
        const jahr = i === 0 ? 1 : Math.ceil((laufzeit / (balken - 1)) * i);
        const rate = monatlicheEinzahlung * Math.pow(1 + erhoehung, jahr - 1);
        const breite = (rate / maxRate) * 100;

        verlaufContainer.innerHTML += `
            <div class="verlauf-row">
                <span class="verlauf-label">J${jahr}</span>
                <div class="verlauf-bar-wrap">
                    <div class="verlauf-bar" style="width: ${breite}%"></div>
                </div>
                <span class="verlauf-wert">${Math.round(rate)}€</span>
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

document.querySelectorAll('.input-group').forEach(gruppe => {
    const einheit = gruppe.dataset.einheit;
    const slider = gruppe.querySelector('input[type="range"]');
    const num = gruppe.querySelector('input[type="number"]')
    const display = gruppe.querySelector('.input-value-display');

    const max = parseFloat(gruppe.dataset.max) || Infinity; // wenn nichts festgelegt ist kein Limit

    slider.addEventListener('input', () => {
        num.value = slider.value;
        display.textContent = formatDisplay(slider.value, einheit);
        calculate();
    });

    num.addEventListener('input', () => {
        if (parseFloat(num.value) > max) {
            num.value = max;
        }
        slider.value = num.value;
        display.textContent = formatDisplay(num.value, einheit);
        calculate();
    });

});

function formatDisplay(wert, einheit) {
    if (einheit === '€') return Number(wert).toLocaleString('de-DE') + ' €';
    if (einheit === 'Jahre') return wert + ' Jahre';
    if (einheit === '%') return wert + ' %';
    return wert;
}

calculate(); // beim start einmalig

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
        target.classList.toggle('disabled');
        calculate(); // -> hier nochmal aufrufen
    }

    toggle.addEventListener('change', updateToggle);
    updateToggle();
});