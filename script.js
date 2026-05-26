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
    if (einheit === "€/Mo") return Number(wert).toLocaleString('de-DE', {maximumFractionDigits: 2}) + " €/Mo.";

    return wert + " " + einheit;
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

    // entnahme-tab

    const entnahmeJahr = new Date().getFullYear() + input.laufzeit;
    document.getElementById("entnahme-jahr").textContent = entnahmeJahr;
    document.getElementById("entnahme-brutto").textContent = formatDisplay(input.entnahme, "€/Mo");
    const netto = input.steuerAktiv ? input.entnahme - (input.entnahme * nachTFS) : input.entnahme;
    document.getElementById("entnahme-netto").textContent = formatDisplay(netto, "€/Mo");
    const kaufkraft = netto / Math.pow(1 + input.inflation, input.laufzeit);
    document.getElementById("entnahme-kaufkraft").textContent = formatDisplay(kaufkraft, "€/Mo");

    document.getElementById("kapital-haelt").textContent = ergebnisse.entnahmeJahre;
    document.getElementById("ewige-entnahme").textContent = ergebnisse.ewigeEntnahme;

}

function updateColors() {
    colors = {
    orange: style.getPropertyValue('--accent-orange'),
    green: style.getPropertyValue('--accent-green'),
    blue: style.getPropertyValue('--accent-blue'),
    muted: style.getPropertyValue('--text-muted'),
    primary: style.getPropertyValue('--text-primary'),
    grid: style.getPropertyValue('--border') + '66', // opacity 40% durch 66
    bgCard: style.getPropertyValue('--bg-card'),
    border: style.getPropertyValue('--border'),
    };
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
        entnahme:            parseInt(document.getElementById("entnahme-num").value),
        renditeEntnahme:     parseFloat(document.getElementById("entnahme-rendite-num").value) / 100,
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

const style = getComputedStyle(document.documentElement);
let colors = {
    orange: style.getPropertyValue('--accent-orange'),
    green: style.getPropertyValue('--accent-green'),
    blue: style.getPropertyValue('--accent-blue'),
    muted: style.getPropertyValue('--text-muted'),
    primary: style.getPropertyValue('--text-primary'),
    grid: style.getPropertyValue('--border') + '66', // opacity 40% durch 66
    bgCard: style.getPropertyValue('--bg-card'),
    border: style.getPropertyValue('--border'),
};

let lineChart = null;

function zeichneVermoegensverlauf(verlauf) {

    if (lineChart) {
        // daten updaten
        lineChart.data.labels = verlauf.labels;
        lineChart.data.datasets[0].data = verlauf.dataBrutto;
        lineChart.data.datasets[1].data = verlauf.dataNetto;
        lineChart.data.datasets[2].data = verlauf.dataKaufkraft;
        lineChart.data.datasets[3].data = verlauf.dataEingezahlt;
        
        // farben bei theme-wechsel updaten
        lineChart.data.datasets[0].backgroundColor = colors.orange;
        lineChart.data.datasets[1].backgroundColor = colors.green;
        lineChart.data.datasets[2].backgroundColor = colors.blue;
        lineChart.data.datasets[3].backgroundColor = colors.muted;
        lineChart.data.datasets[0].borderColor = colors.orange;
        lineChart.data.datasets[1].borderColor = colors.green;
        lineChart.data.datasets[2].borderColor = colors.blue;
        lineChart.data.datasets[3].borderColor = colors.muted;
        lineChart.options.scales.x.ticks.color = colors.muted;
        lineChart.options.scales.y.ticks.color = colors.muted;
        lineChart.options.scales.x.grid.color = colors.grid;
        lineChart.options.scales.y.grid.color = colors.grid;
        lineChart.options.plugins.legend.labels.color = colors.muted;
        lineChart.options.plugins.tooltip.backgroundColor = colors.bgCard;
        lineChart.options.plugins.tooltip.titleColor = colors.muted;
        lineChart.options.plugins.tooltip.bodyColor = colors.primary;
        lineChart.options.plugins.tooltip.borderColor = colors.border;
        lineChart.update();
        return;
    }

    lineChart = new Chart(document.getElementById('vermoegens-chart'), {
        type: 'line',
        data: {
            labels: verlauf.labels,
            datasets: [
                {
                    label: 'Brutto',
                    data: verlauf.dataBrutto,
                    backgroundColor: colors.orange,
                    pointRadius: 0,
                    pointStyle: 'rect'
                },
                {
                    label: 'Netto',
                    data: verlauf.dataNetto,  
                    backgroundColor: colors.green,    
                    pointRadius: 0,
                    pointStyle: 'rect'
                },
                {
                    label: 'Kaufkraftbereinigt',
                    data: verlauf.dataKaufkraft,
                    backgroundColor: colors.blue,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointStyle: 'rect'
                },
                {
                    label: 'Eingezahlt',
                    data: verlauf.dataEingezahlt,
                    backgroundColor: colors.muted,
                    borderColor: colors.muted,
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
                        color: colors.muted, 
                        usePointStyle: true, 
                        boxWidth: 12,
                        boxHeight: 12,
                    },
                },
                tooltip: {
                    backgroundColor: colors.bgCard,
                    titleColor: colors.muted,
                    bodyColor: colors.primary,
                    borderColor: colors.border,
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
                    ticks: { color: colors.muted, maxTicksLimit: 10 },
                    grid: { display: true, color: colors.grid },
                },
                y: {
                    ticks: {
                        color: colors.muted,
                        callback: val => val >= 1_000_000
                            ? (val / 1_000_000).toFixed(1) + 'M €'
                            : (val / 1_000).toFixed(0) + 'K €'
                    },
                    grid: { color: colors.grid, display: true},
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            }
        }
    });
}

function berechneZuwachs(input) {

    const labels = [], dataZinsen = [], dataEinzahlungen = [];

    let bruttoVorher = input.startkapital;
    let eingezahltVorher = input.startkapital;

    for (let jahr = 0; jahr < input.laufzeit; jahr++) {
        
        const bruttoJetzt = berechneBruttoEndkapital({ ...input, laufzeit: jahr + 1 });
        const eingezahltJetzt = berechneEingezahlt({ ...input, laufzeit: jahr + 1 });

        const einzahlungenDesJahres = eingezahltJetzt - eingezahltVorher;
        const zinsenDesJahres = bruttoJetzt - bruttoVorher - einzahlungenDesJahres;

        labels.push(`J${jahr + 1}`);
        dataZinsen.push(zinsenDesJahres);
        dataEinzahlungen.push(einzahlungenDesJahres);

        bruttoVorher = bruttoJetzt;
        eingezahltVorher = eingezahltJetzt;
    }

    return { labels, dataZinsen, dataEinzahlungen };

}

let barChart = null;

function zeichneKapitalzuwachs(verlauf) {

    if (barChart) {
        barChart.data.labels = verlauf.labels;
        barChart.data.datasets[0].data = verlauf.dataZinsen;
        barChart.data.datasets[1].data = verlauf.dataEinzahlungen;

        // theme update...
        barChart.data.datasets[0].backgroundColor = colors.orange;
        barChart.data.datasets[1].backgroundColor = colors.green;
        barChart.options.scales.x.ticks.color = colors.muted;
        barChart.options.scales.y.ticks.color = colors.muted;
        barChart.options.scales.x.grid.color = colors.grid;
        barChart.options.scales.y.grid.color = colors.grid;
        barChart.options.plugins.legend.labels.color = colors.muted;
        barChart.options.plugins.tooltip.backgroundColor = colors.bgCard;
        barChart.options.plugins.tooltip.titleColor = colors.muted;
        barChart.options.plugins.tooltip.bodyColor = colors.primary;
        barChart.options.plugins.tooltip.borderColor = colors.border;
        barChart.update();
        return;
    }

    barChart = new Chart(document.getElementById('zuwachs-chart'), {
        type: 'bar',
        data: {
            labels: verlauf.labels,
            datasets: [
                {
                    label: 'Zinsen',
                    data: verlauf.dataZinsen,
                    backgroundColor: colors.orange,
                    pointStyle: 'rect'
                },
                {
                    label: 'Eingezahlt',
                    data: verlauf.dataEinzahlungen,
                    backgroundColor: colors.green,
                    pointStyle: 'rect'
                }
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
                        color: colors.muted, 
                        usePointStyle: true, 
                        boxWidth: 12,
                        boxHeight: 12,
                    },
                },
                tooltip: {
                    backgroundColor: colors.bgCard,
                    titleColor: colors.muted,
                    bodyColor: colors.primary,
                    borderColor: colors.border,
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
                    ticks: { color: colors.muted, maxTicksLimit: 10 },
                    grid: { display: true, color: colors.grid },
                    stacked: true,
                },
                y: {
                    ticks: {
                        color: colors.muted,
                        callback: val => val >= 1_000_000
                            ? (val / 1_000_000).toFixed(1) + 'M €'
                            : (val / 1_000).toFixed(0) + 'K €'
                    },
                    grid: { color: colors.grid, display: true},
                    stacked: true,
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            }
        }
    });    
}

function aktualisiereVergleich(input, gesamtStSatz) {

    const szenarien = [
        { label: "-1 % Rendite (pessimistisch)", offset: -0.01, id: "sz-pessimistisch" },
        { label: "Jetzige Einstellungen", offset: 0, id: "sz-aktuell" },
        { label: "+1 % Rendite (optimistisch)", offset: 0.01, id: "sz-optimistisch" }
    ];

    szenarien.forEach(({ label, offset, id }) => {
        const mod = {... input, bruttoRendite: input.bruttoRendite + offset};
        const brutto = berechneBruttoEndkapital(mod);
        const eingezahlt = berechneEingezahlt(mod);
        const netto = berechneNettoEndkapital(mod, brutto, eingezahlt, gesamtStSatz);
        const kaufkraft = netto / Math.pow(1 + mod.inflation, mod.laufzeit);
        const faktor = kaufkraft / eingezahlt;


        document.getElementById(id).innerHTML = `
            <span>${label}</span>
            <span>${formatEuro(brutto)}</span>
            <span>${formatEuro(netto)}</span>
            <span>${formatEuro(kaufkraft)}</span>
            <span>${formatFaktor(faktor)}</span>

        `;
    });
}

function analysiereTragfaehigkeit(input, ergebnisse) {

    let endKapital = ergebnisse.bruttoEndkapital;

    // zählen wie lange das kapital hält.
    let jahre = 0;
    let ausgangsKapital = endKapital;
    while (true) {

        if (jahre > 150) { // endless loop verhindern
            break;
        }

        endKapital *= (1 + input.renditeEntnahme);
        endKapital -= 12 * input.entnahme;
        if (endKapital <= 0) break;

        if (endKapital >= ausgangsKapital) {
            return "Ewig ∞";
        }
        ++jahre;
    }

    return jahre + " Jahre";
}

function ewigeEntnahme(input, ergebnisse) {

    const benoetigtesKapital = (input.entnahme * 12) / input.renditeEntnahme;

    if (benoetigtesKapital > ergebnisse.bruttoEndkapital) {
        return "Nicht in Laufzeit";
    }

    console.log(benoetigtesKapital, ergebnisse.bruttoEndkapital);

    let ewigeEntnahme = 0;

    for (let jahr = 1; jahr <= input.laufzeit; ++jahr) {
        const kapital = berechneBruttoEndkapital({ ...input, laufzeit: jahr });
        if (kapital >= benoetigtesKapital) {
            return formatDisplay(jahr, "Jahre");
        }
    }
}

function main() {

    updateColors();

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

    const verlauf = berechneJahresverlauf(input, gesamtStSatz);
    zeichneVermoegensverlauf(verlauf);

    const zuwachs = berechneZuwachs(input);
    zeichneKapitalzuwachs(zuwachs);

    aktualisiereVergleich(input, gesamtStSatz);

    ergebnisse.entnahmeJahre = analysiereTragfaehigkeit(input, ergebnisse);
    ergebnisse.ewigeEntnahme = ewigeEntnahme(input, ergebnisse);

    anzeigenAktualisieren(input, ergebnisse);
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