
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

calculate();
console.log('Sparplanrechner geladen');