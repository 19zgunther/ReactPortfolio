
var dropdownElement = document.getElementById("exampleCircuitDropDown");


function InitExampleCircuits() {
    /*
    dropdownElement.innerHTML += "<option>voltage divider example</option>";
    dropdownElement.innerHTML += "<option>ideal diode example</option>";
    dropdownElement.innerHTML += "<option>ideal zener diode example</option>";
    dropdownElement.innerHTML += "<option>comparator example</option>";
    dropdownElement.innerHTML += "<option>inverting amplifier example</option>";
    dropdownElement.innerHTML += "<option>non-inverting amplifier example</option>";
    dropdownElement.innerHTML += "<option>op amp oscillator example</option>";
    */
    var s = `
        <optgroup label = "Basic Examples">
            <option>    voltage divider example         </option>
            <option>    RC circuit example              </option>
            <option>    RL circuit example              </option>
            <option>    RLC circuit example             </option>
        </optgroup>    
        <optgroup label = "Diode Examples">
            <option>    ideal diode example             </option>
            <option>    ideal zener diode example       </option>
            <option>    full bridge rectifier example   </option>
        </optgroup>
        <optgroup label = "OpAmp/Comparator Examples">
            <option>    comparator example              </option>
            <option>    inverting amplifier example     </option>
            <option>    non-inverting amplifier example </option>
            <option>    op amp oscillator example       </option>
        </optgroup>
    `;

    dropdownElement.innerHTML += s.toString();


    





}

function ChangeExampleCircuit() {
    console.log( dropdownElement.value );
    switch (dropdownElement.value)
    {
        case "voltage divider example": LoadCircuit("voltageSource2n 348997 380 300 380 100 5V 0Hz wire 288454 380 100 500 100 resistor 172935 500 100 500 200 1000Ω resistor 778194 500 200 500 300 1000Ω wire 711113 500 300 380 300 wire 574008 500 200 620 200 voltageSource1n 782431 380 300 380 340 0V 0Hz plot 348997 plot 574008");break;
        case "RC circuit example": LoadCircuit("capacitor c1 540 320 540 120 1uF resistor r1 540 120 380 120 100Ω voltageSource2n v1 280 320 280 120 5V 0Hz wire w1 280 320 540 320 voltageSource1n v2 280 320 280 360 0V 0Hz switch sw1 380 120 280 120 resistor r2 540 120 700 120 100Ω switch sw2 700 120 700 320 wire w2 700 320 540 320 plot c1");break;
        case "RL circuit example": LoadCircuit("resistor r1 460 120 300 120 100Ω voltageSource2n v1 200 320 200 120 5V 0Hz wire w1 200 320 460 320 voltageSource1n v2 200 320 200 360 0V 0Hz switch sw1 300 120 200 120 resistor r2 460 120 620 120 100Ω switch sw2 620 120 620 320 wire w2 620 320 460 320 inductor L1 460 320 460 120 10mH plot L1");break;
        case "RLC circuit example": LoadCircuit("resistor r1 720 120 560 120 2Ω voltageSource2n v1 560 320 560 120 5V 0Hz wire w1 560 320 980 320 voltageSource1n v2 560 320 560 360 0V 0Hz inductor L1 720 120 980 120 1mH capacitor c1 980 320 980 120 1uF plot L1 plot c1");break;

        case "ideal diode example": LoadCircuit("voltageSource2n v1 320 240 320 100 5V 5kHz voltageSource1n v2 320 240 320 280 0V 0Hz wire w1 320 240 420 240 resistor r1 320 100 420 100 1000Ω diode d1 420 100 420 240 700mV 1000MV 10mΩ plot v1 plot d1"); break;
        case "ideal zener diode example": LoadCircuit("voltageSource2n v1 320 240 320 100 5V 5kHz voltageSource1n v2 320 240 320 280 0V 0Hz wire w1 320 240 420 240 resistor r1 320 100 420 100 1000Ω diode d1 420 100 420 240 700mV 10V 10mΩ plot v1 plot d1"); break;
        case "full bridge rectifier example": LoadCircuit("voltageSource2n v1 360 360 360 60 5V 5kHz diode d2 520 140 700 140 700mV 1000MV 10mΩ diode d3 700 140 880 140 700mV 1000MV 10mΩ diode d1 700 280 880 280 700mV 1000MV 10mΩ diode d4 520 280 700 280 700mV 1000MV 10mΩ wire w1 520 280 520 140 voltageSource1n v6 520 280 520 320 0V 0Hz wire w2 880 280 880 140 resistor r6 880 140 1040 140 50Ω voltageSource1n v7 1040 140 1040 300 0V 0Hz resistor r8 360 360 700 360 1Ω wire w3 700 360 700 280 resistor r5 360 60 700 60 1Ω wire w4 700 60 700 140 plot v1 plot r6"); break;

        case "comparator example": LoadCircuit("voltageSource2n 657517 740 320 740 180 1V 0Hz opamp 351757 740 160 940 160 10V -10V 10uV voltageSource1n 351587 740 320 740 340 0V 0Hz wire 554776 740 140 640 140 voltageSource2n 529492 640 320 640 140 10V 5kHz resistor 44329 940 160 940 320 1000Ω wire 795120 640 320 740 320 wire 354621 740 320 940 320 plot 529492 plot 657517 plot 44329"); break;
        case "inverting amplifier example": LoadCircuit("voltageSource2n 297135 260 320 260 200 5V 5kHz voltageSource1n 136043 260 320 260 360 0V 0Hz opamp 331905 380 220 560 220 10V -10V 10uV voltageSource1n 120448 380 240 380 360 0V 0Hz resistor 122448 380 200 260 200 1000Ω wire 260761 380 200 380 140 resistor 959868 380 140 560 140 2kΩ wire 410021 560 140 560 220 wire 31843 560 220 660 220 resistor 510847 660 220 660 340 220Ω voltageSource1n 146325 660 340 660 360 0V 0Hz plot 297135 plot 510847");break;
        case "non-inverting amplifier example": LoadCircuit("voltageSource2n 297135 460 380 460 260 5V 5kHz voltageSource1n 136043 460 380 460 420 0V 0Hz opamp 331905 460 240 640 240 10V -10V 10uV resistor 510847 740 240 740 400 220Ω voltageSource1n 146325 740 400 740 420 0V 0Hz wire 222113 640 180 640 240 resistor 357600 640 180 460 180 1000Ω resistor 44305 460 80 460 180 1000Ω wire 913483 460 180 460 220 wire 506890 640 240 740 240 voltageSource1n 818478 460 80 460 60 0V 0Hz plot 297135 plot 510847");break;
        case "op amp oscillator example": LoadCircuit("opamp 141009 700 240 880 240 10V -10V 100uV capacitor 38375 700 160 580 160 10nF wire 68790 700 220 700 160 resistor 948453 700 160 880 160 2.2kΩ wire 656617 880 160 880 240 wire 423283 580 160 580 240 resistor 392728 580 320 700 320 10kΩ wire 981157 700 260 700 320 resistor 235839 700 320 880 320 10kΩ wire 603479 880 320 880 240 wire 991644 580 240 580 320 wire 96308 580 240 500 240 voltageSource1n 229432 500 240 500 320 0V 0Hz wire 103721 880 240 960 240 plot 38375 plot 103721"); break;
    }
}