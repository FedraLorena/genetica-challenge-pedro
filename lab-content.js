(function (root) {
  'use strict';
  const field = (label, expected, type = 'text') => ({ label, expected, type });
  const percent = (label, expected) => field(label, expected, 'percent');
  const genotype = (label, expected) => field(label, expected, 'genotype');
  const match = (title, pairs, targets, explanation, mode = 'connect') => ({ kind: 'match', title, pairs, targets, explanation, mode });
  const fill = (title, fields, explanation) => ({ kind: 'fill', title, fields, explanation });
  const cross = (title, top, left, after, explanation, before = []) => ({ kind: 'cross', title, top, left, before, after, explanation });
  const aboCounts = (a, b, ab, o) => [percent('Grupo A', a), percent('Grupo B', b), percent('Grupo AB', ab), percent('Grupo O', o)];
  const rhCounts = (positive, negative) => [percent('RhD positivo', positive), percent('RhD negativo', negative)];
  const cfCounts = (nnUpper, carrier, nnLower) => [percent('Sin fibrosis quística y no portador (NN)', nnUpper), percent('Portador sin fibrosis quística (Nn)', carrier), percent('Con fibrosis quística (nn)', nnLower)];
  const lessons = [
    {
      title: 'ABO: de los alelos al grupo sanguíneo', short: 'ABO', visual: 'abo',
      text: [
        'Los glóbulos rojos son células de la sangre. En su superficie pueden llevar marcas llamadas antígenos. Para el grupo ABO miramos dos: A y B. El grupo AB tiene ambas y el O no tiene ninguna de esas dos.',
        'Un alelo es una versión de un gen. En el modelo habitual de ABO hay tres versiones, Iᴬ, Iᴮ e i. Cada persona hereda dos, una de cada progenitor. La pareja es el genotipo y el grupo que observamos es el fenotipo. Dos alelos iguales forman un genotipo homocigota. Dos alelos distintos forman uno heterocigota.',
        'Iᴬ permite producir la marca A e Iᴮ la marca B. Cuando están juntos se observan las dos marcas. Eso es codominancia. i no aporta ninguna de estas marcas y es recesivo frente a Iᴬ e Iᴮ. Por ejemplo, Iᴬi es grupo A y solo ii es grupo O en este modelo.',
        'Una célula reproductora, o gameto, recibe un solo alelo de la pareja. El cuadro de Punnett reúne el alelo de arriba con el de la izquierda. En nuestros cuadros las cuatro casillas pesan lo mismo, 25 % cada una. Para escribir genotipos con el teclado, podés usar IAi, IBi o IAIB en lugar de los superíndices.'
      ],
      example: { title: 'Grupo AB × grupo O', top: ['Iᴬ', 'Iᴮ'], left: ['i', 'i'], steps: ['Traducí los grupos. AB es IᴬIᴮ y O es ii.', 'Colocá Iᴬ e Iᴮ arriba. El progenitor O solo aporta i, que se repite en las dos filas.', 'Cada casilla reúne un aporte de cada lado. Hay dos Iᴬi y dos Iᴮi: 50 % A, 50 % B, 0 % AB y 0 % O.'] },
      activities: [
        match('Uní cada combinación con el grupo que se observa. Podés reutilizar un grupo.', [['Iᴮi', 'B'], ['ii', 'O'], ['IᴬIᴮ', 'AB'], ['IᴬIᴬ', 'A'], ['IᴮIᴮ', 'B'], ['Iᴬi', 'A']], ['AB', 'O', 'B', 'A'], 'Buscá qué marcas aporta cada alelo. Iᴬ e Iᴮ juntos dan AB. En Iᴬi e Iᴮi, i no aporta una segunda marca. ii no produce A ni B.'),
        cross('Una persona A heterocigota tiene descendencia con una B heterocigota. Armá el cruce con la persona A arriba y la B a la izquierda.', ['Iᴬ', 'i'], ['Iᴮ', 'i'], aboCounts(25, 25, 25, 25), 'Iᴬi aporta Iᴬ o i e Iᴮi aporta Iᴮ o i. Salen IᴬIᴮ, Iᴮi, Iᴬi e ii. Cada grupo ocupa una sola casilla.')
      ]
    },
    {
      title: 'Rh: cómo descubrir qué alelos pueden aportar los padres', short: 'Rh', visual: 'rh',
      text: [
        'RhD positivo indica que los glóbulos rojos presentan la marca D. RhD negativo indica ausencia de esa marca. Usamos el modelo escolar D/d. D domina sobre d para esta marca y d representa ausencia de D, no un segundo antígeno.',
        'DD y Dd se observan como positivos. dd se observa como negativo. Alguien negativo solo aporta d. Una persona positiva puede ser DD o Dd si no tenemos más información.',
        'Para deducir una pareja de alelos, seguí dos pistas. Si una persona positiva tiene un progenitor negativo, recibió d de él. Como presenta la marca D, su otro aporte debe ser D. Su combinación es Dd.',
        'En el cuadro cada gameto lleva un alelo. Un progenitor Dd ofrece D o d. Uno dd ofrece d en ambos lugares. Las probabilidades valen para cada nuevo nacimiento.'
      ],
      example: { title: 'Dos personas positivas tienen un hijo negativo', top: ['D', 'd'], left: ['D', 'd'], steps: ['El hijo negativo es dd. Recibió un d de cada progenitor.', 'Como ambos progenitores son positivos, cada uno tiene además un D. El cruce es Dd × Dd y ambos ofrecen D o d.', 'Hay un DD, dos Dd y un dd. Solo dd es negativo, así que otro nacimiento tiene 25 % de probabilidad de ser negativo.'] },
      activities: [
        match('Conectá cada progenitor con lo que pueden llevar sus gametos.', [['Dd', 'D o d'], ['dd', 'Solo d'], ['DD', 'Solo D']], ['Solo d', 'Solo D', 'D o d'], 'Separá las dos copias. DD solo tiene D para transmitir. dd solo tiene d. Dd puede transmitir cualquiera de las dos versiones.'),
        cross('Una persona RhD positiva tiene madre negativa. Tiene descendencia con otra persona negativa. Colocá a la primera arriba y a la segunda a la izquierda.', ['D', 'd'], ['d', 'd'], rhCounts(50, 50), 'La madre dd necesariamente aportó d. La persona positiva también tiene D, así que es Dd. La otra persona es dd. Dos casillas son Dd y dos dd.', [genotype('Persona positiva', 'Dd'), genotype('Persona negativa', 'dd')])
      ]
    },
    {
      title: 'Fibrosis quística: sanos, portadores y afectados', short: 'Fibrosis quística', visual: 'cf',
      text: [
        'La fibrosis quística es una enfermedad hereditaria relacionada con el gen CFTR. El gen está en un cromosoma que no es sexual, llamado autosoma. Se necesitan dos variantes causales, una en cada copia del gen. Por eso su herencia se llama autosómica recesiva.',
        'Para este laboratorio, N representa una copia funcional y n una variante causal. En la realidad, las dos variantes causales pueden ser distintas. Las letras NN, Nn y nn son un modelo didáctico. El curso principal usa f para la misma categoría que aquí representamos con n.',
        'En el modelo, NN es una persona sin fibrosis quística que no porta la variante. Nn es una persona portadora sin fibrosis quística y nn es una persona con fibrosis quística. «Sana» en este ejercicio se refiere solo a la ausencia de esta enfermedad.',
        'Una persona sin fibrosis quística puede ser NN o Nn. Para afirmar Nn hace falta evidencia, como haber aportado n a un descendiente nn. Entre dos portadores, una cuarta parte de las combinaciones es nn. Cada nuevo embarazo tiene sus propias probabilidades.'
      ],
      example: { title: 'Dos progenitores portadores', top: ['N', 'n'], left: ['N', 'n'], steps: ['Cada portador tiene Nn. Cada gameto lleva N o n.', 'Al cruzar los gametos salen NN, Nn, Nn y nn. Cada casilla vale 25 %.', 'Por embarazo hay 25 % NN, 50 % Nn y 25 % nn. Un hijo sin la enfermedad podría estar en la casilla NN o en cualquiera de las Nn.'] },
      activities: [
        match('Clasificá las tarjetas según lo que permite afirmar cada combinación.', [['Nn', 'Portador sin fibrosis quística'], ['nn', 'Con fibrosis quística'], ['NN', 'Sin fibrosis quística y no portador'], ['Sin fibrosis quística, sin más datos', 'Genotipo no determinado']], ['Con fibrosis quística', 'Genotipo no determinado', 'Sin fibrosis quística y no portador', 'Portador sin fibrosis quística'], 'Para presentar la enfermedad se necesitan dos n en el modelo. Una sola n permite transmitirla sin presentar la enfermedad. Sin más datos, no se elige entre NN y Nn.', 'classify'),
        cross('Una persona portadora tiene descendencia con una persona con fibrosis quística. Ubicá Nn arriba y nn a la izquierda.', ['N', 'n'], ['n', 'n'], cfCounts(0, 50, 50), 'nn siempre aporta n. Nn aporta N o n. Dos Nn son portadores sin fibrosis quística y dos nn presentan la enfermedad. NN no puede aparecer.')
      ]
    },
    {
      title: 'Del cuadro a las probabilidades: genotipo versus fenotipo', short: 'Probabilidades', visual: 'counts',
      text: [
        'Primero anotá los genotipos que resultan del cruce. Después traducí cada casilla a lo que se observa, su fenotipo. Si dos genotipos dan el mismo fenotipo, sumá sus casillas.',
        'Una casilla de cuatro equivale a 25 %, dos a 50 %, tres a 75 % y cuatro a 100 %. Un fenotipo que no aparece tiene 0 %. Estos porcentajes se aplican a cada nacimiento. No describen una secuencia obligatoria.',
        'En ABO, IᴮIᴮ e Iᴮi pertenecen al mismo grupo B. En Rh, DD y Dd son ambos positivos. En fibrosis quística, NN y Nn comparten la ausencia de enfermedad, pero solo Nn indica que la persona porta n.'
      ],
      example: { title: 'Grupo B heterocigota × grupo AB', top: ['Iᴮ', 'i'], left: ['Iᴬ', 'Iᴮ'], steps: ['Separá Iᴮ e i arriba e Iᴬ e Iᴮ a la izquierda.', 'Las casillas son IᴬIᴮ, Iᴬi, IᴮIᴮ e Iᴮi. Hay cuatro genotipos, pero al traducir aparecen AB, A, B y B.', 'Sumá las dos casillas B. Resultado: 25 % AB, 25 % A, 50 % B y 0 % O. Tener cuatro genotipos no obliga a tener cuatro grupos.'] },
      activities: [
        fill('En Dd × Dd las casillas son DD, Dd, Dd y dd. Escribí el fenotipo de Dd y los porcentajes. Usá «positivo» o «negativo» para el fenotipo.', [field('Fenotipo RhD de Dd', 'positivo'), ...rhCounts(75, 25)], 'DD y los dos Dd se observan como positivos. Sumá sus tres casillas. Solo dd es negativo.'),
        cross('Ahora una persona A heterocigota tiene descendencia con una AB. Construí el cruce con A arriba y AB a la izquierda.', ['Iᴬ', 'i'], ['Iᴬ', 'Iᴮ'], aboCounts(50, 25, 25, 0), 'Las casillas IᴬIᴬ e Iᴬi dan A, así que se suman. IᴬIᴮ da AB e Iᴮi da B. Falta ii, por eso O queda en 0 %.')
      ]
    }
  ];
  const challenge = [
    match('Relacioná cada concepto con su definición.', [['Genotipo', 'Pareja de alelos'], ['Fenotipo', 'Característica observada'], ['Gameto', 'Célula reproductora que aporta un alelo']], ['Característica observada', 'Célula reproductora que aporta un alelo', 'Pareja de alelos'], 'Las letras describen el genotipo. Lo que observás es el fenotipo. Un gameto transporta uno de los alelos para el gen estudiado.'),
    match('Clasificá estas combinaciones según si sus versiones son iguales o distintas.', [['IᴬIᴬ', 'Homocigota'], ['Iᴮi', 'Heterocigota'], ['dd', 'Homocigota'], ['Nn', 'Heterocigota']], ['Heterocigota', 'Homocigota'], 'Homocigota significa dos versiones iguales. Heterocigota significa dos versiones distintas.', 'classify'),
    fill('Una persona de grupo A tiene padre de grupo O. Escribí el genotipo de la persona A y el de su padre.', [genotype('Persona A', 'Iᴬi'), genotype('Padre O', 'ii')], 'Su padre es ii, por lo que aporta i. El grupo A de la persona requiere además Iᴬ.'),
    fill('Una persona con fibrosis quística tiene una hermana sin fibrosis quística. Sin más información, escribí los dos genotipos compatibles con la hermana, separados por una coma.', [field('Genotipos posibles', ['NN', 'Nn'], 'genotype-list')], 'Solo se descarta nn por la ausencia de la enfermedad. NN y Nn siguen siendo posibles, aunque haya una persona afectada en la familia.'),
    cross('Una persona DD tiene descendencia con una dd. Poné DD arriba y dd a la izquierda.', ['D', 'D'], ['d', 'd'], rhCounts(100, 0), 'DD siempre aporta D y dd siempre aporta d. Las cuatro casillas son Dd y todas son positivas.'),
    cross('Una persona de grupo B cuyo padre es O tiene descendencia con una persona de grupo O. Ubicá B arriba y O a la izquierda.', ['Iᴮ', 'i'], ['i', 'i'], aboCounts(0, 50, 0, 50), 'B debe ser Iᴮi porque recibió i de su padre. La otra persona aporta siempre i. Dos casillas dan B y dos O.', [genotype('Persona B', 'Iᴮi'), genotype('Persona O', 'ii')]),
    cross('Una persona confirmada como no portadora (NN) tiene descendencia con una portadora. Poné NN arriba y a la persona portadora a la izquierda.', ['N', 'N'], ['N', 'n'], cfCounts(50, 50, 0), 'NN siempre aporta N. Nn aporta N o n. Dos casillas son NN y dos Nn. No hay nn.'),
    cross('Una persona positiva tiene padre RhD negativo. Su pareja es positiva y ya tuvieron un hijo negativo. Poné a la primera persona arriba y a la pareja a la izquierda. Calculá las probabilidades de otro nacimiento.', ['D', 'd'], ['D', 'd'], rhCounts(75, 25), 'La primera recibió d de su padre. Su pareja tuvo que aportar d al hijo dd. Ambas son positivas y por eso tienen D. En Dd × Dd solo una casilla es dd.', [genotype('Primera persona', 'Dd'), genotype('Pareja', 'Dd')]),
    cross('Una persona B tiene madre O y su pareja también es B. Ya tuvieron un hijo O. Deducí ambos genotipos y calculá los grupos de otro nacimiento.', ['Iᴮ', 'i'], ['Iᴮ', 'i'], aboCounts(0, 75, 0, 25), 'La primera persona recibió i de su madre. La pareja también aportó i al hijo O. El cruce Iᴮi × Iᴮi da IᴮIᴮ, Iᴮi, Iᴮi e ii. Las tres primeras son B.', [genotype('Primera persona', 'Iᴮi'), genotype('Pareja', 'Iᴮi')]),
    cross('Dos personas sin fibrosis quística tuvieron un hijo con la enfermedad. Deducí el cruce. Calculá por separado el porcentaje de portadores y el porcentaje total sin fibrosis quística en otro embarazo.', ['N', 'n'], ['N', 'n'], [percent('Portadores', 50), percent('Sin fibrosis quística, incluyendo portadores', 75), percent('Con fibrosis quística', 25)], 'El hijo nn recibió n de ambos. Como los progenitores no presentan la enfermedad, ambos son Nn. Dos casillas Nn son portadoras. Las dos Nn y la NN suman tres casillas sin fibrosis quística.', [genotype('Primer progenitor', 'Nn'), genotype('Segundo progenitor', 'Nn')])
  ];
  [1, 3, 0, 2, 1, 0, 2, 1, 3, 2].forEach((lesson, i) => { challenge[i].review = lesson; });
  const data = { lessons, challenge };
  root.LabContent = data;
  if (typeof module !== 'undefined') module.exports = data;
})(globalThis);
