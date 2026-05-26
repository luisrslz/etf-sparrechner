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

    if (wert > 1_000_000_000) {
        const mrd = wert / 1_000_000_000;
        return mrd.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Mrd. €';
    }
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

// aktualisiert alle infos im info-panel und result-panel 
function anzeigenAktualisieren(input, ergebnisse) {

    // nettorendite info aktualisieren
    const nettoRendite = input.bruttoRendite - input.ter;
    document.getElementById("nettorendite-display").textContent = formatDisplay((nettoRendite * 100).toFixed(2), "%");

    // für subtitle inflation im ergebnis kaufkraft
    document.getElementById('inflationsrate-display').textContent = (input.inflation * 100).toFixed(1); 

    // einzahlungen card subtitle
    document.getElementById('gesamteinzahlungen-sub').textContent = formatDisplay((ergebnisse.eingezahlt / ergebnisse.nettoEndkapital * 100).toFixed(1), "%");

    const zinsgewinneBrutto = (ergebnisse.bruttoEndkapital - ergebnisse.eingezahlt) / ergebnisse.bruttoEndkapital * 100;
    // zinsgewinne brutto card subtitle
    document.getElementById('zinsgewinne-brutto-sub').textContent = formatDisplay(zinsgewinneBrutto.toFixed(1), "%");

    // ter-verlust subtitle
    document.getElementById('ter-sub').textContent = formatDisplay((input.ter * 100).toFixed(2), "%");

    // realrendite info aktualisieren
    const realRendite = nettoRendite - input.inflation;
    document.getElementById("realrendite-display").textContent = formatDisplay((realRendite * 100).toFixed(2), "%");

    const nachTFS = ergebnisse.gesamtStSatz * (1 - input.tfs);
    if (input.steuerAktiv) {
        document.getElementById('gesamt-steuersatz').textContent = formatDisplay((ergebnisse.gesamtStSatz * 100).toFixed(3), "%");
        document.getElementById('nach-tfs').textContent = formatDisplay((nachTFS * 100).toFixed(3), "%");
        document.getElementById('tfs-sub').textContent = formatDisplay((nachTFS * 100).toFixed(2), "%");
    } else {
        document.getElementById('gesamt-steuersatz').textContent = '-';
        document.getElementById('nach-tfs').textContent = '-';
        document.getElementById('tfs-sub').textContent = '0 %';
    }

    // result panel ausgeben
    document.getElementById('endkapital-brutto').textContent = formatEuro(ergebnisse.bruttoEndkapital);
    document.getElementById('endkapital-netto').textContent = formatEuro(ergebnisse.nettoEndkapital);
    document.getElementById('kaufkraft').textContent = formatEuro(ergebnisse.kaufkraft);
    document.getElementById('kapitalfaktor').textContent = formatFaktor(ergebnisse.faktor);
    document.getElementById('gesamteinzahlungen').textContent = formatEuro(ergebnisse.eingezahlt);
    document.getElementById('zinsgewinne-brutto').textContent = formatEuro(ergebnisse.bruttoEndkapital - ergebnisse.eingezahlt);
    document.getElementById('steuerbelastung').textContent = formatEuro((ergebnisse.bruttoEndkapital - ergebnisse.nettoEndkapital));
    document.getElementById('ter-verlust').textContent = formatEuro(ergebnisse.endkapitalOhneTER - ergebnisse.bruttoEndkapital);
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

// ergebnisse für jedes jahr
function berechneJahresverlauf(input, gesamtStSatz) {

    const labels = [], dataBrutto = [], dataNetto = [], dataKaufkraft = [], dataEingezahlt = [];

    for (let jahr = 0; jahr < input.laufzeit; jahr++) {
        
        const brutto = berechneBruttoEndkapital({ ...input, laufzeit: jahr + 1 });
        const eingezahlt = berechneEingezahlt({ ...input, laufzeit: jahr + 1 });
        const netto = berechneNettoEndkapital(input, brutto, eingezahlt, gesamtStSatz);
        const kaufkraft = netto / Math.pow(1 + input.inflation, jahr + 1);
        

        labels.push(`Jahr ${jahr + 1}`);
        dataBrutto.push(Math.round(brutto));
        dataNetto.push(Math.round(netto));
        dataKaufkraft.push(Math.round(kaufkraft));
        dataEingezahlt.push(Math.round(eingezahlt));
    }

    return { labels, dataBrutto, dataNetto, dataKaufkraft, dataEingezahlt };
}

let chart = null;

function zeichneVermoegensverlauf(verlauf) {

    const style = getComputedStyle(document.documentElement);
    const orange = style.getPropertyValue('--accent-orange');
    const green  = style.getPropertyValue('--accent-green');
    const blue   = style.getPropertyValue('--accent-blue');
    const muted  = style.getPropertyValue('--text-muted');
    const primary = style.getPropertyValue('--text-primary');
    const grid = style.getPropertyValue('--border').trim() + '66'; // opacity 40% durch 66

    if (chart) {
        // daten updaten
        chart.data.labels = verlauf.labels;
        chart.data.datasets[0].data = verlauf.dataBrutto;
        chart.data.datasets[1].data = verlauf.dataNetto;
        chart.data.datasets[2].data = verlauf.dataKaufkraft;
        chart.data.datasets[3].data = verlauf.dataEingezahlt;
        
        // farben bei theme-wechsel updaten
        chart.data.datasets[0].borderColor = orange;
        chart.data.datasets[1].borderColor = green;
        chart.data.datasets[2].borderColor = blue;
        chart.data.datasets[3].borderColor = muted;
        chart.options.scales.x.ticks.color = muted;
        chart.options.scales.y.ticks.color = muted;
        chart.options.scales.y.grid.color = grid;
        chart.update();
        return;
    }

    chart = new Chart(document.getElementById('vermoegens-chart'), {
        type: 'line',
        data: {
            labels: verlauf.labels,
            datasets: [
                {
                    label: 'Brutto',
                    data: verlauf.dataBrutto,
                    pointRadius: 0,
                    pointStyle: 'rect'
                },
                {
                    label: 'Netto',
                    data: verlauf.dataNetto,      
                    pointRadius: 0,
                    pointStyle: 'rect'
                },
                {
                    label: 'Kaufkraftbereinigt',
                    data: verlauf.dataKaufkraft,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointStyle: 'rect'
                },
                {
                    label: 'Eingezahlt',
                    data: verlauf.dataEingezahlt,
                    borderColor: muted,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointStyle: 'rect'
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: { 
                        color: muted, 
                        usePointStyle: true, 
                        boxWidth: 12,
                        boxHeight: 12,
                    },
                },
                tooltip: {
                    backgroundColor: style.getPropertyValue('--bg-card').trim(),
                    titleColor: muted,
                    bodyColor: style.getPropertyValue('--text-primary').trim(),
                    borderColor: style.getPropertyValue('--border').trim(),
                    borderWidth: 1,
                    // tooltip zahlen formatieren
                    callbacks: {
                        label: (ctx) => {
                            const wert = ctx.parsed.y;
                            const label = ctx.dataset.label;
                            if (wert >= 1_000_000) {
                                return ` ${label}: ${(wert / 1_000_000).toFixed(2)} Mio. €`;
                            }
                            return ` ${label}: ${Math.round(wert).toLocaleString('de-DE')} €`;
                            }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: muted, maxTicksLimit: 10 },
                    grid: { display: true, color: grid },
                },
                y: {
                    ticks: {
                        color: muted,
                        callback: val => val >= 1_000_000
                            ? (val / 1_000_000).toFixed(1) + 'M €'
                            : (val / 1_000).toFixed(0) + 'K €'
                    },
                    grid: { color: grid, display: true},
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            }
        }
    });
}

function main() {

    const input = leseInputs();
    
    const bruttoEndkapital = berechneBruttoEndkapital(input);
    const eingezahlt = berechneEingezahlt(input);

    const gesamtStSatz = berechneGesamtStSatz(input);
    const nettoEndkapital = berechneNettoEndkapital(input, bruttoEndkapital, eingezahlt, gesamtStSatz);

    const kaufkraft = nettoEndkapital / Math.pow(1 + input.inflation, input.laufzeit);

    const faktor = kaufkraft / eingezahlt;

    zeichneBalken(input);

    const endkapitalOhneTER = berechneBruttoEndkapital({ ...input, ter: 0 });

    const ergebnisse = {
        bruttoEndkapital,
        nettoEndkapital,
        gesamtStSatz,
        eingezahlt,
        kaufkraft,
        faktor, 
        endkapitalOhneTER
    };

    anzeigenAktualisieren(input, ergebnisse);

    const verlauf = berechneJahresverlauf(input, gesamtStSatz);
    zeichneVermoegensverlauf(verlauf);

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
    main();
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