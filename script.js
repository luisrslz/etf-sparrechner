
const ZINSSATZ_JAHR = 0.07; // später verstellbar

function calculate() {
    const startkapital = parseFloat(document.getElementById("startkapital").value);
    const monatlicheEinzahlung = parseFloat(document.getElementById("sparrate").value);
    const laufzeit = parseInt(document.getElementById("laufzeit").value);

    const r = ZINSSATZ_JAHR / 12; // monatlich
    const n = laufzeit * 12; 

    // zinseszins
    const endkapital = startkapital * Math.pow(1 + r, n)
                       + monatlicheEinzahlung * (Math.pow(1 + r, n) - 1) / r;    
                       
    const eingezahlt = startkapital + monatlicheEinzahlung * n;

    const faktor = endkapital / eingezahlt;

    // ausgeben
    document.getElementById('endkapital-brutto').textContent = formatEuro(endkapital);
    document.getElementById('kapitalfaktor').textContent = formatFaktor(faktor);

    // später
    document.getElementById('endkapital-netto').textContent = '-';
    document.getElementById('kaufkraft').textContent = '-';
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

    slider.addEventListener('input', () => {
        num.value = slider.value;
        display.textContent = formatDisplay(slider.value, einheit);
        calculate();
    });

    num.addEventListener('input', () => {
        slider.value = num.value;
        display.textContent = formatDisplay(num.value, einheit);
        calculate();
    });

});

function formatDisplay(wert, einheit) {
    if (einheit === '€') return Number(wert).toLocaleString('de-DE') + ' €';
    if (einheit === 'Jahre') return wert + ' Jahre';
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