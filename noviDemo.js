
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//globalni ehrID (ehrIDD)
//ehrId iz url-ja
var globalEhrID = getParameterByName("ehrId");
var globalSp02;
var globalCurrElevation;


//AJAX applications are browser- and platform-independent!

//GET or POST? (== type of request)
//Sending a large amount of data to the server (POST has no size limitations)
//Sending user input (which can contain unknown characters), POST is more robust and secure than GET
//ajax .open(<type>, <url>, <true=async>)

//function getSessionId(): is used to obtain a session (ehr session) used for authentication
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

//variable ehrId: holds our sample patientâ€™s ehrId.
//ustvarim bolnika
function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	//pobere podatke iz inputov
	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		//add a default header to every request
		//An object of additional header key/value pairs to send along with requests using the XMLHttpRequest transport.
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		//POST /ehr: creates a new EHR
		$.ajax({
			//Specifies the URL to send the request to.
		    url: baseUrl + "/ehr",
		    //Specifies the type of request. (GET or POST)
		    type: 'POST',
		    async: false,
		    //A function to be run when the request succeeds
		    //data - contains the resulting data from the request
		    success: function (data) {
		        //var ehrId = data.ehrId;
		        globalEhrID = data.ehrId;
		        //GET /demographics/ehr/{ehrId}/party: retrieves patientâ€™s demographic data
		        // build party data
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            //partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		            partyAdditionalInfo: [{key: "ehrId", value: globalEhrID}]
		        };
		        //POST /demographics/party: creates a new party in the demographics server and stores an ehrId
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            async: false,
		            //The content type used when sending data to the server.
		            contentType: 'application/json',
		            //Specifies data to be sent to the server
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                	//$("#result").html("Created: " + party.meta.href); //Created: https://rest.ehrscape.com/rest/v1/demographics/party/104
		                    //$("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>UspeÅ¡no kreiran EHR '" + ehrId + "'.</span>");
		                    //console.log("UspeÅ¡no kreiran EHR '" + ehrId + "'.");
		                    //$("#preberiEHRid").val(ehrId);
		                    $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + globalEhrID + "'.</span>");
		                    console.log("Uspešno kreiran EHR '" + globalEhrID + "'.");
		                    $("#preberiEHRid").val(globalEhrID);
		                    $("#dodajVitalnoEHR").val(globalEhrID);
		                    $("#meritveVitalnihZnakovEHRid").val(globalEhrID);
		                    
		                    //ustvarim novega uporabnika v listi uporabnikov
		                    //ce ga hocem shranit za dlje casa-> local storage HTML
		                    //<option value="254f791d-2e7c-49d9-b646-376f62d6ead5">Babica Mili</option>
		                    var noviVnos = '<option value="' + globalEhrID +'">' + ime + ' ' + priimek +'</option>';
		                    $(noviVnos).appendTo("#preberiObstojeciEHR");
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
	}
}

//vneses ehr, najde podatke o bolniku
function preberiEHRodBolnika() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();
	globalEhrID = ehrId;

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			//url: baseUrl + "/demographics/ehr/" + ehrIDD + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.</span>");
				console.log("Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label label-danger fade-in'>Tm,  '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}	
}

//vneses ehr, najde podatke o bolniku
function preberiPodatkeOBolnikuIzEhr() {
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	globalEhrID = ehrId;

		$.ajax({
			//url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			url: baseUrl + "/demographics/ehr/" + globalEhrID + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#prijavljenUporabnik").text(party.firstNames + " " + party.lastNames);
				console.log("Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.");
			},
			error: function(err) {
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
}

function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	//var ehrId = $("#dodajVitalnoEHR").val();
	$("#dodajVitalnoEHR").val(globalEhrID);
	var ehrId = globalEhrID;
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	globalSp02 = nasicenostKrviSKisikom;
	globalCurrElevation = $("input[name=elevation]:checked", "#elevationForm").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    "ehrId": ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		    	console.log(res.meta.href);
		        $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
		    },
		    //error: function(err) {
		    //	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
			//	console.log(JSON.parse(err.responseText).userMessage);
		    //}
		});
	}
}

function preveriKisik() {
	sessionId = getSessionId();
	
	//legenda: meje: red | yellow | green | blue
	//za yellow sem vzela 3%, saj ce pade 3% -> acute disease may be suspected (common cold or pneumonia)
	//modro pomeni, da je previsoko (gledam visinski trening)
	if (globalCurrElevation == "under1500") {
		//meje: <94 | [94,96) | [96,100]
		if (globalSp02 < 94) {
			$(".progress-bar").addClass("progress-bar-danger");
			$("#kisikSporocilo").html("<span class='obvestilo label label-danger fade-in'>Nivo kisika v vaši krvi je nevarno prenizek!</span>");
			$("#kisikRazlaga").text("Normalen odstotek kisika v krvi na tej nadmorski višini je 96-100%.");
		}
		else if (globalSp02 < 96) {
			$(".progress-bar").addClass("progress-bar-warning");
			$("#kisikSporocilo").html("<span class='obvestilo label label-warning fade-in'>Nivo kisika v vaši krvi je prenizek!</span>");
			$("#kisikRazlaga").text("Normalen odstotek kisika v krvi na tej nadmorski višini je 96-100%. Priporočljivo je, da si kisik izmerite še na kakem drugem delu telesa. Poizkusite tudi to: One technique for raising your blood oxygen level at altitude is something called 'pressure breathing'. The idea is to artificially raise the pressure of the air in your lungs by pursing your lips to slow the air escaping while exhaling HARD for about 1 minute. It's very counter-intuitive, but it works great.");
		}
		else {
			$(".progress-bar").addClass("progress-bar-success");
			$("#kisikSporocilo").html("<span class='obvestilo label label-success fade-in'>Nivo kisika v vaši krvi se nahaja v normalnih mejah.</span>");
			$("#kisikRazlaga").text("");
		}
	}
	else if (globalSp02 == "over1500") {
		//meje: <87 | [87, 90) | [90,95] | (95, 100]
		if (globalSp02 < 87) {
			$(".progress-bar").addClass("progress-bar-danger");
			$("#kisikSporocilo").html("<span class='obvestilo label label-danger fade-in'>Nivo kisika v vaši krvi je nevarno prenizek!</span>");
			$("#kisikRazlaga").text("Željen odstotek kisika v krvi na tej nadmorski višini je 90-95%.");
		}
		else if (globalSp02 < 90) {
			$(".progress-bar").addClass("progress-bar-warning");
			$("#kisikSporocilo").html("<span class='obvestilo label label-warning fade-in'>Nivo kisika v vaši krvi je prenizek!</span>");
			$("#kisikRazlaga").text("Željen odstotek kisika v krvi na tej nadmorski višini je 90-95%. Priporočljivo je, da si kisik izmerite še na kakem drugem delu telesa. Mogoč razlog je akutna bolezen (prehlad, pljučnica). Če se meritve dalj časa ne spremenijo, kontaktirajte zdravnika. Poizkusite tudi to: One technique for raising your blood oxygen level at altitude is something called 'pressure breathing'. The idea is to artificially raise the pressure of the air in your lungs by pursing your lips to slow the air escaping while exhaling HARD for about 1 minute. It's very counter-intuitive, but it works great.");
		}
		else if (globalSp02 <= 95) {
			$(".progress-bar").addClass("progress-bar-success");
			$("#kisikSporocilo").html("<span class='obvestilo label label-success fade-in'>Nivo kisika v vaši krvi se nahaja v normalnih mejah.</span>");
			$("#kisikRazlaga").text("Lahko nadaljujete z IHT viÅ¡inskim treningom.");
		}
		else {
			$(".progress-bar").addClass("progress-bar-info");
			$("#kisikSporocilo").html("<span class='obvestilo label label-info fade-in'>Nivo kisika v vaši krvi je previsok.</span>");
			$("#kisikRazlaga").text("Ostanite na isti nadmorski višini. Da lahko nadaljujete z IHT višinskim treningom in se pomaknete na višjo nadmorsko višino, mora biti raven kisika v vaši krvi 90-95%");
		}
	}
	else if (globalCurrElevation == "over3000") {
		//meje: <82 | [82, 85) | [85,90] | (90, 100]
		if (globalSp02 < 82) {
			$(".progress-bar").addClass("progress-bar-danger");
			$("#kisikSporocilo").html("<span class='obvestilo label label-danger fade-in'>Nivo kisika v vaši krvi je nevarno prenizek!</span>");
			$("#kisikRazlaga").text("Željen odstotek kisika v krvi na tej nadmorski višini je 85-90%.");
		}
		else if (globalSp02 < 85) {
			$(".progress-bar").addClass("progress-bar-warning");
			$("#kisikSporocilo").html("<span class='obvestilo label label-warning fade-in'>Nivo kisika v vaši krvi je prenizek!</span>");
			$("#kisikRazlaga").text("Željen odstotek kisika v krvi na tej nadmorski višini je 85-90%. Priporočljivo je, da si kisik izmerite še na kakem drugem delu telesa. Mogoč razlog je akutna bolezen (prehlad, pljučnica). Če se meritve dalj časa ne spremenijo, kontaktirajte zdravnika. Poizkusite tudi to: One technique for raising your blood oxygen level at altitude is something called 'pressure breathing'. The idea is to artificially raise the pressure of the air in your lungs by pursing your lips to slow the air escaping while exhaling HARD for about 1 minute. It's very counter-intuitive, but it works great.");
		}
		else if (globalSp02 <= 90) {
			$(".progress-bar").addClass("progress-bar-success");
			$("#kisikSporocilo").html("<span class='obvestilo label label-success fade-in'>Nivo kisika v vaši krvi se nahaja v normalnih mejah.</span>");
			$("#kisikRazlaga").text("Lahko nadaljujete z IHT višinskim treningom.");
		}
		else {
			$(".progress-bar").addClass("progress-bar-info");
			$("#kisikSporocilo").html("<span class='obvestilo label label-info fade-in'>Nivo kisika v vaši krvi je previsok.</span>");
			$("#kisikRazlaga").text("Ostanite na isti nadmorski višini. Da lahko nadaljujete z IHT višinskim treningom in se pomaknete na višjo nadmorsko višino, mora biti raven kisika v vaši krvi 85-90%");
		}
	}
	else { //cez 6000
		//meje: <77 | [77, 80) | [80,85] | (85, 100]
		if (globalSp02 < 77) {
			$(".progress-bar").addClass("progress-bar-danger");
			$("#kisikSporocilo").html("<span class='obvestilo label label-danger fade-in'>Nivo kisika v vaši krvi je nevarno prenizek!</span>");
			$("#kisikRazlaga").text("Željen odstotek kisika v krvi na tej nadmorski višini je 80-85%.");
		}
		else if (globalSp02 < 80) {
			$(".progress-bar").addClass("progress-bar-warning");
			$("#kisikSporocilo").html("<span class='obvestilo label label-warning fade-in'>Nivo kisika v vaši krvi je prenizek!</span>");
			$("#kisikRazlaga").text("Željen odstotek kisika v krvi na tej nadmorski višini je 80-85%. Priporočljivo je, da si kisik izmerite še na kakem drugem delu telesa. Mogoč razlog je akutna bolezen (prehlad, pljučnica). Če se meritve dalj časa ne spremenijo, kontaktirajte zdravnika. Poizkusite tudi to: One technique for raising your blood oxygen level at altitude is something called 'pressure breathing'. The idea is to artificially raise the pressure of the air in your lungs by pursing your lips to slow the air escaping while exhaling HARD for about 1 minute. It's very counter-intuitive, but it works great.");
		}
		else if (globalSp02 <= 85) {
			$(".progress-bar").addClass("progress-bar-success");
			$("#kisikSporocilo").html("<span class='obvestilo label label-success fade-in'>Nivo kisika v vaši krvi se nahaja v normalnih mejah.</span>");
			$("#kisikRazlaga").text("Lahko nadaljujete z IHT višinskim treningom.");
		}
		else {
			$(".progress-bar").addClass("progress-bar-info");
			$("#kisikSporocilo").html("<span class='obvestilo label label-info fade-in'>Nivo kisika v vaši krvi je previsok.</span>");
			$("#kisikRazlaga").text("Ostanite na isti nadmorski višini. Da lahko nadaljujete z IHT višinskim treningom in se pomaknete na višjo nadmorsko višino, mora biti raven kisika v vaši krvi 80-85%");
		}
	}
}

function preberiMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	//var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	var ehrId = globalEhrID;
	var tip = $("#preberiTipZaVitalneZnake").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
				if (tip == "telesna temperatura") {
					$.ajax({
						url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
						type: 'GET',
						headers: {"Ehr-Session": sessionId},
						success: function (res) {
							if (res.length > 0) {
								var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
								for (var i in res) {
									results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].temperature + " " + res[i].unit + "</td>";
								}
								results += "</table>";
								$("#rezultatMeritveVitalnihZnakov").append(results);
							} else {
								$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
							}
						},
						error: function() {
							$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
						}
					});
					
				} else if (tip == "spO2") {
					$.ajax({
						url: baseUrl + "/view/" + ehrId + "/spO2?limit=100",
						type: 'GET',
						headers: {"Ehr-Session": sessionId},
						success: function (res) {
							if (res.length > 0) {
								
								//D3.js graf
								var svg = dimple.newSvg("#graf", 500, 400);
								var data = [];
								
								for(var i in res) {
									data.push({"O2": res[i].spO2, "Date": new Date(res[i].time)});
								}
								
								var graf = new dimple.chart(svg, data);
								graf.setBounds(60, 30, 505, 305);
								var x = graf.addCategoryAxis("x", "Date");
								x.addOrderRule("Date");
								graf.addMeasureAxis("y", "O2");
								var s = graf.addSeries(null, dimple.plot.area);
								graf.draw();
								
								var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Nasičenost krvi</th></tr>";
								for (var i in res) {
									results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].spO2 + "% " + "</td>";
									//results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + "% " + "</td>";
								}
								
								
								results += "</table>";
								$("#rezultatMeritveVitalnihZnakov").append(results);
							} else {
								$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
							}
						},
						error: function() {
							$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
						}
					});
					
				} else if (tip == "spO2_AQL") {
					var AQL =
						"select " +
						"a, " +
						"b_a, " +
						"b_a/time/value as casNe, "+
						"b_a/data[at0001]/origin/value as cas, " +
    					"b_a/data[at0001]/events[at0002]/data[at0003]/items[at0006]/value/numerator as spO2 " +
    					"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
						"contains COMPOSITION a[openEHR-EHR-COMPOSITION.encounter.v1] " +
						"contains OBSERVATION b_a[openEHR-EHR-OBSERVATION.indirect_oximetry.v1] " +
						"where a/name/value='Vital Signs' " +
						"order by b_a/data[at0001]/origin/value desc " +
						"limit 15";
						
					$.ajax({
						url: baseUrl + "/query?" + $.param({"aql": AQL}),
						type: 'GET',
						headers: {"Ehr-Session": sessionId},
						success: function (res) {
							var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
							if (res) {
								var rows = res.resultSet;
								for (var i in rows) {
									results += "<tr><td>" + rows[i].cas + "</td><td class='text-right'>" + rows[i].spO2 + " %</td>";
								}
								results += "</table>";
								$("#rezultatMeritveVitalnihZnakov").append(results);
							} else {
								$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
							}
						},
						error: function() {
						$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
						console.log(JSON.parse(err.responseText).userMessage);
						}
					});
				}
		},
		error: function(err) {
			$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
			console.log(JSON.parse(err.responseText).userMessage);
		}
		});
	}
}


//te stvari so narejeno fiksno, iz dropdown menija
//ko izberem nekaj v meniju, se nastimajo vrednosti polj.
$(document).ready(function() {
	
	//nastavim nov URL, ko se izbere uporabnisko ime.
	//ne dela ubistvu,dela znotraj preberiObstojeciEhr
	$('#preberiEHRid').change(function() {
	    $("#prijavniGumb").attr("href", "meritve.html?ehrId=" + globalEhrID);
	})
		
	//nastavim nov URL, ko kreiram novega bolnika
	$('#prijavniGumbNewUser').click(function() {
		kreirajEHRzaBolnika();
		window.location = "./meritve.html?ehrId=" + globalEhrID;
		//$("#prijavniGumbNewUser").attr("href", "meritve.html?ehrId=" + globalEhrID);
	})
	
	$('#preberiPredlogoBolnika').change(function() {
		$("#kreirajSporocilo").html("");
		//naredim ?tabelo, kjer locim po vejicah
		var podatki = $(this).val().split(",");
		$("#kreirajIme").val(podatki[0]);
		$("#kreirajPriimek").val(podatki[1]);
		$("#kreirajDatumRojstva").val(podatki[2]);
	});
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		//nastavim novi URL, ko se izbere uporabnisko ime.
		$("#preberiEHRid").val($(this).val());
		globalEhrID = $(this).val();
		$("#prijavniGumb").attr("href", "meritve.html?ehrId=" + globalEhrID);
		$("#dodajVitalnoEHR").val($(this).val());
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
	$('#preberiObstojeciVitalniZnak').change(function() {
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[2]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[3]);
	});
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
	
	//preverim usklajenost visine in kisika
	$('#dodajMeritve').click(function() {
		$("#graf").html("");
		dodajMeritveVitalnihZnakov();
		//izberem barvo prikaza
		preveriKisik();
		//dinamicno se spremeni dolzina progress-a
		$(".progress-bar").css('width', globalSp02 + '%' );
	})
	//nastavi razred nazaj na osnovnega
	$('#dodajVitalnoNasicenostKrviSKisikom').change(function() {
	    $(".progress-bar").attr('class', 'progress-bar');
	})
	$("input[name=elevation]:radio").change(function() {
	    $(".progress-bar").attr('class', 'progress-bar');
	})
	
	//po pritisku gumba prijavi, kjer naredim novega uporabnika
	//nastavim globalEhrID v Vnos meritev, da obdrzim prijavljenega uporabnika
	if (globalEhrID !== undefined) {
	 	$("#dodajVitalnoEHR").val(globalEhrID);
	 	$("#meritveVitalnihZnakovEHRid").val(globalEhrID);
	 	preberiPodatkeOBolnikuIzEhr();
	}
});