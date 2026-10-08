// Textos del Game Master: dimensiones de la memoria, guardianes y efectos narrativos.
// Cada dimensión corresponde a un nivel de complejidad de la base de preguntas (1 → 9).

window.NARRATIVE = {
  intro: {
    title: "El Viaje de Tito",
    subtitle: "El Retorno a la Semilla",
    paragraphs: [
      "Miami, 11:47 de la noche. Desde el piso catorce, Tito mira la I-95 como quien mira un río que no lleva a ninguna parte: una serpiente de luces rojas y blancas que nunca duerme. Los neones de Brickell parpadean en azul eléctrico, el aire acondicionado zumba con su frío de hospital, y en la pared cuelga un almanaque de una farmacia de la Calle Ocho que nadie ha cambiado desde marzo.",
      "Tiene treinta y cinco años y una sospecha que no le cuenta a nadie: algo le está robando la isla por dentro. Ayer quiso cantarle a su sobrina «Arroz con leche» y se quedó en blanco a la mitad. Ya no está seguro de qué quería decir «me piro», y el cañonazo de las nueve es apenas un eco, como un portazo en otro edificio. Los viejos del dominó tienen un nombre para eso. Le dicen <em>la Neblina del Norte</em>.",
      "Esa noche, sin saber muy bien por qué, saca del fondo del gabinete la vieja cafetera de aluminio que se trajo de Cuba envuelta en una toalla. Le echa el café, la aprieta bien, la pone en la hornilla. Espera.",
      "El primer borboteo no suena a cafetera. Suena a <strong>clave</strong>: <em>tac — tac — tac … tac — tac</em>. El vapor no se disipa: se espesa, se vuelve dorado como el melao, huele a salitre y a tabaco, y se abre en el medio de la cocina como una puerta.",
      "—Tito —dice la cafetera, con voz de abuela y repique de madera—, la Neblina te está dejando sin pasado. Cruza. Busca tus recuerdos donde los dejaste. Y no vas solo: llevas contigo a tu <strong>Sangre Mambisa</strong>.",
      "Esa Sangre Mambisa eres tú. Tito siente en el bolsillo de la guayabera el peso de <strong>cinco fichas de dominó de nácar</strong>: son su ancla. Cada vez que tu intuición le falle, una se agrietará y se volverá polvo de asfalto. Si se pierden las cinco, la isla se le borra para siempre.",
      "Al otro lado del vapor ya se escucha el mar contra el muro. Es el Malecón… pero no el de las postales: uno que flota entre la memoria y el sueño."
    ],
    cta: "☕ Cruzar el vapor"
  },

  levels: {
    1: "Recuerdo Borroso",
    2: "Recuerdo Borroso",
    3: "Eco Lejano",
    4: "Memoria Tibia",
    5: "Memoria Viva",
    6: "Raíz Despierta",
    7: "Sangre Caliente",
    8: "Corazón de Guayabera",
    9: "Cubano de Pura Cepa"
  },

  // Una dimensión por nivel. "arrive" se usa en el primer reto; "again" en el segundo.
  dimensions: [
    {
      key: "malecon",
      level: 1,
      place: "El Malecón Místico",
      emoji: "🌊",
      guardian: "El Pescador de Espuma",
      arrive: [
        "Tito sale del vapor y sus zapatos de Payless pisan un muro de piedra porosa, húmedo y tibio. Es el Malecón, pero el mar está suspendido en el aire: las olas se detienen a mitad del salto como cortinas de cristal verde, y dentro de cada una se ve un recuerdo congelado — un papalote, un beso, un radio Selena tocando a lo lejos. Del lado del Vedado, sin embargo, avanza una pared gris que huele a gasolina y a parqueo techado: la Neblina del Norte, borrando las fachadas de colores como quien pasa una goma.",
        "Sentado en el muro hay un viejo hecho de espuma de mar, con un sombrero de yarey y una vara de pescar cuyo nylon se pierde entre las nubes. Sus ojos son dos caracoles. —Mucho tiempo sin venir, muchacho —dice, sin mirarlo—. A ver si todavía te acuerdas de lo que te enseñó tu abuela."
      ],
      again: [
        "La ola que Tito liberó todavía resuena, pero la Neblina no se rinde: se enrosca alrededor de los faroles como un gato flaco y apaga uno, luego otro. Las luces amarillas del Malecón titilan. Un almendrón azul pasa flotando a medio metro del suelo, sin chofer, y se deshace en humo gris antes de llegar a La Rampa.",
        "El Pescador de Espuma tira de su vara y saca del aire, en vez de un pez, una palabra brillante que se retuerce en el anzuelo. —Esta se te estaba escapando —gruñe—. Agárrala antes de que se la trague el frío."
      ],
      win: "las olas congeladas se descongelan de golpe y revientan contra el muro en una explosión de espuma color turquesa; los faroles se encienden uno a uno hasta el Morro y un trío empieza a tocar «Guantanamera» desde un banco",
      lose: "las olas detenidas se vuelven de plomo, el salitre sabe a escape de camión y el rumor del mar se convierte en el zumbido monótono de la I-95 a las seis de la tarde"
    },
    {
      key: "solar",
      level: 2,
      place: "El Solar de Mamá Inés",
      emoji: "☕",
      guardian: "Mamá Inés, la del Café Eterno",
      arrive: [
        "El portal lo escupe en el patio de un solar de La Habana Vieja. Hay tendederas cruzadas de balcón a balcón, y la ropa colgada baila sola al ritmo de un tambor que no se ve. Las paredes respiran: se descascaran y se vuelven a pintar de rosado, de verde, de amarillo canario. Pero por las escaleras baja la Neblina, fría como un lobby de banco, y donde toca, los colores se vuelven beige de oficina.",
        "En el centro del patio, frente a un fogón de carbón, una señora con pañuelo blanco cuela café en un colador de tela que nunca se vacía. El olor le llega a Tito directo al pecho. —Ay, mijo —dice Mamá Inés—. Siéntate. Pero antes de darte la tacita, dime una cosa…"
      ],
      again: [
        "Una puerta del solar se cierra sola con un golpe seco y del cuarto sale un frío de nevera. Las tendederas se tensan; una sábana blanca se vuelve gris y se desploma al suelo. Alguien, arriba, apaga el radio en mitad de un son.",
        "Mamá Inés no se inmuta. Sopla el humo del café hacia la Neblina como quien espanta un mosquito y le sirve a Tito otra tacita. —Esa cosa le tiene miedo al café fuerte —dice—. Y a la gente que se acuerda. A ver, otra."
      ],
      win: "el patio estalla en colores de pared recién pintada, la ropa tendida se infla como velas de un barco y desde todos los balcones a la vez se oye un coro: «¡todos los negros tomamos café!»",
      lose: "el café se enfría en la tacita y sabe a agua de máquina de oficina; el tambor escondido se calla y en su lugar suena el pitido de un microondas en otro apartamento"
    },
    {
      key: "parque",
      level: 3,
      place: "El Parque de los Caballitos de Cartón",
      emoji: "🎠",
      guardian: "Pin Pón, el Muñeco de Cartón",
      arrive: [
        "Tito cae suavemente sobre un caballito de madera que gira en un carrusel oxidado. Es un parque de diversiones de la infancia — un poco Parque Lenin, un poco Coney Island de Miramar, un poco sueño — donde la estrella fugaz de la noria se apaga y se enciende. Los algodones de azúcar flotan como nubes rosadas. Pero en la taquilla, la Neblina ha colgado un cartelito: «Cerrado por mantenimiento», y los caballitos se van poniendo grises, de plástico chino.",
        "Del carrusel se baja un muñeco de cartón, muy lindo, con los cachetes pintados y un pañuelito. Se lava la carita con agua y con jabón, se desenreda el pelo con su peine de marfil, y mira a Tito con ojos de botón. —Si no te acuerdas de esto —dice Pin Pón—, el parque se cierra para siempre."
      ],
      again: [
        "La noria se detiene con un chirrido. Las luces de colores de los puestos se vuelven fluorescentes blancas de supermercado, y una voz metálica anuncia por un altavoz: «Attention, shoppers…». Los niños de la memoria se quedan quietos como maniquíes.",
        "Pin Pón le da un tirón de la manga con su manito de cartón. —Ese altavoz es de ella, de la Neblina. ¡No le hagas caso! Contéstame esta y la noria vuelve a girar."
      ],
      win: "la noria arranca de nuevo con un estruendo de bombillos de colores, los caballitos relinchan de verdad y una lluvia de algodón de azúcar color mamey cae sobre los niños que vuelven a correr gritando",
      lose: "Pin Pón se empapa como cartón bajo la lluvia, los caballitos se vuelven de plástico gris y del altavoz sale, en loop, la musiquita de espera de una línea de servicio al cliente"
    },
    {
      key: "bodega",
      level: 4,
      place: "La Bodega de la Esquina",
      emoji: "🧺",
      guardian: "Cuco, el Bodeguero de los Cuatro Brazos",
      arrive: [
        "El portal se abre detrás de un mostrador de madera gastada. Es la bodega del barrio, con su pizarra de precios escrita con tiza, sacos de arroz, una pesa de aguja y el olor inconfundible a jabón de lavar y a chícharo. Las colas de la memoria están ahí: señoras con jabas, un viejo que discute de pelota. Pero la Neblina ha llenado los estantes de cajas gringas idénticas, con códigos de barra que zumban y borran las etiquetas.",
        "Detrás del mostrador hay un bodeguero con cuatro brazos y un lápiz detrás de cada oreja. Despacha, anota, cobra y se rasca la cabeza, todo a la vez. —¿Quién es el último? —grita, y luego mira a Tito fijo—. Tú. Para que te despache, primero me tienes que contestar."
      ],
      again: [
        "Una caja registradora digital aparece de la nada sobre el mostrador y empieza a imprimir un ticket larguísimo que se enrosca por el suelo como una serpiente blanca. Las señoras de la cola se van volviendo transparentes, una por una.",
        "Cuco agarra la registradora con dos de sus brazos y la tira a un saco de frijoles. Con el tercero señala a Tito y con el cuarto se seca el sudor. —Aquí se paga con memoria, compadre. ¡Dale, que la cola espera!"
      ],
      win: "los estantes se llenan de frascos de dulce de guayaba que brillan como lámparas, la pizarra se reescribe sola con tiza de colores y la cola entera aplaude mientras el viejo de la pelota grita «¡jonrón!»",
      lose: "los sacos de arroz se convierten en cajas de cartón sin nombre, la pizarra se borra hasta quedar negra y la bodega se llena del frío seco de un pasillo de congelados a las tres de la mañana"
    },
    {
      key: "cabana",
      level: 5,
      place: "La Fortaleza del Cañonazo",
      emoji: "💥",
      guardian: "El Artillero de las Nueve",
      arrive: [
        "Tito aparece sobre las murallas de La Cabaña al caer la tarde. Abajo, la bahía brilla como una lámina de cobre y La Habana entera prende sus luces. Los soldados de la memoria, vestidos con uniformes coloniales, encienden antorchas a lo largo del camino de ronda. Pero el cielo, en vez de ponerse violeta, se está poniendo gris de estacionamiento, y el reloj de la fortaleza marca una hora que no existe: las 8:61.",
        "Junto al cañón espera un artillero con casaca roja y una mecha encendida que no se consume nunca. —Si el cañonazo de las nueve no suena —dice con voz de trueno—, La Habana se queda sin cerrar las puertas, y la Neblina entra por la muralla. Respóndeme, y yo disparo."
      ],
      again: [
        "La Neblina sube por la bahía como una marea sucia y empieza a tapar la boca del cañón. La mecha del artillero chisporrotea y se pone azul. A lo lejos, en vez de campanas, suena una alarma de carro que nadie apaga.",
        "El Artillero protege la mecha con su sombrero de tres picos. —¡Otra más, Sangre Mambisa! Que esta ciudad lleva siglos cerrando las puertas a las nueve y no va a dejar de hacerlo por un poco de humo."
      ],
      win: "el cañón truena con un ¡BUUUM! que sacude la bahía entera, el cielo se rompe en franjas violetas y anaranjadas, y todas las luces de La Habana se encienden a la vez como si alguien hubiera subido el breaker del mundo",
      lose: "la mecha se apaga con un siseo, el cañón se cubre de óxido gris y a las nueve en punto, en lugar del cañonazo, se escucha el bip-bip-bip de un camión dando marcha atrás"
    },
    {
      key: "almendron",
      level: 6,
      place: "El Almendrón del Tiempo",
      emoji: "🚗",
      guardian: "Chicho, el Chofer de Almendrón",
      arrive: [
        "Esta vez el portal es la puerta trasera de un Chevrolet del 57, rojo y blanco, que avanza por una Carretera Central infinita. Por las ventanillas pasan los paisajes de toda una vida: un campo de caña, una playa, el portal de la casa de los abuelos. El carro huele a gasolina, a vinil caliente y a perfume barato. Pero cada vez que Tito parpadea, por la ventanilla se cuela un tramo del Palmetto Expressway, con sus vallas de abogados y su tráfico de las cinco.",
        "El chofer, con una gorrita y una mano de seis dedos sobre un timón forrado de peluche, lo mira por el retrovisor. —No me tires la puerta, ¿eh? —advierte—. Y fíjate, que este carro camina con gasolina de recuerdos. Si no me contestas, nos quedamos botados en el Palmetto."
      ],
      again: [
        "El motor del almendrón tose. En el radio, el reguetón se corta y entra un locutor en inglés hablando de seguros de carro. Por las ventanillas, la caña se convierte en postes de luz y los postes en un parqueo de Walmart que no se acaba nunca.",
        "Chicho le da un manotazo al radio y el son vuelve a sonar. —¡Eso no se queda así! —dice—. Échale otra respuesta al tanque, mi hermano, que estamos subiendo la loma."
      ],
      win: "el almendrón ruge como un león, las vallas del Palmetto salen volando como hojas secas y el carro entra a toda velocidad en un atardecer rojo de Cuba, con las ventanillas bajas y el son a todo volumen",
      lose: "el motor se apaga en seco, el Chevrolet se vuelve un Corolla gris de alquiler y Tito queda varado en el carril de la izquierda mientras le pitan cuarenta carros a la vez"
    },
    {
      key: "carnaval",
      level: 7,
      place: "El Carnaval de Santiago Encantado",
      emoji: "🥁",
      guardian: "El Diablito de la Conga",
      arrive: [
        "El calor golpea primero. Tito está en medio de una conga santiaguera que baja por la calle Trocha: corneta china, tambores, farolas que giran, cientos de cuerpos sudados que se mueven como una sola ola. Las comparsas brillan con lentejuelas de todos los colores. Pero la Neblina se ha metido en el carnaval como un aire acondicionado industrial: donde pasa, la gente se queda quieta, mirando el celular.",
        "De la comparsa se separa un diablito con traje de rayas, máscara de saco y una campanita en cada tobillo. Baila alrededor de Tito sin tocar el suelo. —La conga no para, muchacho —dice entre risas—. Pero para que tú entres, tienes que demostrar que eres de aquí."
      ],
      again: [
        "La corneta china desafina y se calla. Una de las farolas de la comparsa se apaga y se queda colgando como un globo pinchado. Los tambores van perdiendo fuerza, como si alguien les estuviera bajando el volumen desde una app.",
        "El Diablito sacude sus campanitas con furia. —¡Eso no es carnaval, eso es un funeral de oficina! —grita—. ¡Contesta otra, que la conga necesita sangre!"
      ],
      win: "la corneta china lanza un grito que rompe la neblina en mil pedazos, los tambores retumban como un terremoto feliz y la conga entera arrastra a Tito calle abajo entre lentejuelas, farolas encendidas y una lluvia de confeti dorado",
      lose: "los tambores se apagan uno a uno hasta que solo queda el tic-tac del aire acondicionado, las lentejuelas se caen como escamas grises y la gente se dispersa en silencio, cada uno por su lado, como a la salida de un mall"
    },
    {
      key: "vinales",
      level: 8,
      place: "Las Vegas de Viñales",
      emoji: "🌿",
      guardian: "El Guajiro del Humo Sabio",
      arrive: [
        "El portal se abre sobre el valle de Viñales al amanecer. Los mogotes se levantan entre la neblina natural del campo — pero esta neblina es blanca, buena, húmeda. Huele a tierra colorada, a hoja de tabaco secándose en la casa de curar, a café de bijol. Un gallo canta tres veces. Pero desde el norte avanza otra neblina, la mala, la gris, y donde toca, los mogotes se vuelven edificios de cristal.",
        "En el portal de un bohío, meciéndose en un taburete, un guajiro con sombrero de guano fuma un tabaco cuyo humo dibuja figuras en el aire: un caballo, una palma, una muchacha bailando. —Hay cosas que solo sabe el que se crió aquí —dice, y echa una bocanada que se queda flotando en forma de pregunta."
      ],
      again: [
        "La neblina gris trepa por las lomas y un mogote entero se convierte en un condominio con piscina. Las palmas reales se encogen hasta volverse palmeras de maceta de hotel. El gallo, a medio canto, se calla.",
        "El guajiro se quita el sombrero, lo sacude contra la rodilla y se lo vuelve a poner. —Esa cosa no sabe lo que es una décima ni un bohío —dice—. Pero tú sí. A ver si es verdad."
      ],
      win: "el humo del tabaco se convierte en un torbellino verde y dorado que barre la neblina gris valle abajo; los mogotes vuelven a brotar de la tierra colorada como gigantes despertando, y desde todas las lomas llega una décima cantada a viva voz",
      lose: "el tabaco se apaga entre los dedos del guajiro, la tierra colorada se cubre de asfalto recién echado y el canto del gallo se convierte en el pitido de un detector de humo con la batería baja"
    },
    {
      key: "ceiba",
      level: 9,
      place: "La Ceiba de la Semilla",
      emoji: "🌳",
      guardian: "La Abuela Ceiba",
      arrive: [
        "El último portal no se abre: se desenrolla como una raíz. Tito está al pie de una ceiba gigantesca, más alta que cualquier edificio de Brickell, cuyas raíces se hunden en toda la isla a la vez. Entre ellas corren ríos de recuerdos: el primer día de escuela, la pañoleta, el olor de la casa de la abuela, el agua de la lluvia en el patio. Es el centro de todo. Y la Neblina lo sabe: ha venido con todo su frío y rodea el árbol como un huracán gris y silencioso.",
        "La corteza de la ceiba se abre y aparece un rostro de abuela, arrugado y sereno, con los ojos llenos de luz. —Has llegado hasta la semilla, mi niño —dice—. Aquí no basta con acordarse un poquito. Aquí hay que ser cubano de pura cepa."
      ],
      again: [
        "El huracán gris aprieta. Las hojas de la ceiba empiezan a caer, y cada una que toca el suelo es un recuerdo que se apaga. Tito escucha, desde muy lejos, el tráfico de la I-95, como si alguien lo estuviera llamando de vuelta al frío.",
        "Las raíces de la ceiba se aferran a los tobillos de Tito, no para atraparlo, sino para sostenerlo. —No te vayas todavía —susurra la Abuela—. Una más. Dímela con el corazón."
      ],
      win: "la ceiba se ilumina desde las raíces hasta la copa como un relámpago al revés, el huracán gris se deshace en lluvia tibia de verano y por cada rama florece un recuerdo: el mar, el café, la voz de la abuela, la clave que nunca dejó de sonar",
      lose: "las hojas de la ceiba se vuelven de papel de impresora, sus raíces se encogen como cables desconectados y el silencio que queda es exactamente igual al de un apartamento vacío a las cuatro de la madrugada"
    }
  ],

  // Plantillas de acierto. {win} = imagen propia de la dimensión.
  success: [
    "Tito cierra los ojos y sonríe. La respuesta le sube del pecho como un buche de café caliente, y de repente {win}. En el bolsillo de la guayabera, una ficha de dominó brilla con luz de nácar y ancla el recuerdo para siempre.",
    "La voz de la Sangre Mambisa retumba dentro de Tito como un tambor batá. El frío de Miami se rompe como un vidrio: {win}. Huele a mar, a café colado, a casa. La ficha en su bolsillo arde, tibia y luminosa.",
    "Tito lo dice en voz alta, sin dudar, con el acento que creía perdido. Y el mundo responde: {win}. Una ráfaga de luz color mamey le atraviesa el pecho y el recuerdo se queda, firme, anclado en la ficha de nácar.",
    "Algo hace clic dentro de Tito, como la tapa de la cafetera al cerrarse. La Neblina retrocede chillando mientras {win}. Tito se ríe solo, como un niño, y siente la ficha de dominó vibrar en su bolsillo como un corazón."
  ],
  successEmojis: ["☕", "🌴", "🇨🇺", "🥁", "🌊", "🎺", "🌺", "☀️", "🪘", "🥭"],

  // Plantillas de error. {lose} = imagen propia de la dimensión. {answer} = respuesta correcta.
  failure: [
    "Tito duda. Abre la boca y la palabra no sale. El frío del exilio le entra por los pies como agua de nevera: {lose}. En el bolsillo de la guayabera, una ficha de dominó se agrieta con un crujido seco y se deshace en polvo de asfalto. Demasiado tarde, la memoria le susurra: «{answer}».",
    "La respuesta equivocada cae al suelo como una moneda de un centavo. El color se escurre del mundo hasta quedar en gris metálico: {lose}. Algo se le aprieta en el pecho, una pérdida sin nombre. Una ficha de nácar se vuelve polvo. Lo que era, era: «{answer}».",
    "La Neblina se ríe sin boca. Tito siente que se le olvida el olor de la casa de su abuela: {lose}. Se lleva la mano al bolsillo y una ficha se le deshace entre los dedos, como arena sucia de construcción. La verdad llega como un eco lejano: «{answer}»."
  ],

  lastLifeWarning: "⚠️ Solo le queda una ficha. Tito la aprieta en el puño con tanta fuerza que se le marcan los puntos en la palma.",

  victory: {
    title: "¡Tito ha vuelto a la semilla!",
    paragraphs: [
      "La cafetera silba en la hornilla. Tito abre los ojos: está en su cocina de Miami, pero ya no es la misma cocina. Por la ventana, la I-95 sigue ahí, con sus luces rojas y blancas, pero ahora a Tito le parece un Malecón de asfalto, y el rugido del tráfico tiene, si uno escucha bien, el tumbao de una clave.",
      "Se sirve el café en una tacita, lo endulza como Dios manda y llama a su sobrina por videollamada. —Ven acá —le dice—. Te voy a enseñar cómo termina «Arroz con leche». Y después te cuento del cañonazo de las nueve.",
      "En el bolsillo de la guayabera, las fichas de dominó que sobrevivieron brillan con luz propia. La Neblina del Norte sigue allá afuera. Pero Tito ya sabe el camino de vuelta."
    ]
  },

  defeat: {
    title: "La Neblina se llevó la isla",
    paragraphs: [
      "La última ficha de dominó se agrieta y se vuelve polvo gris en la palma de Tito. El vapor dorado se apaga como una vela. Está otra vez en su cocina de Miami, de pie frente a la hornilla, con una cafetera de aluminio que no recuerda de dónde salió.",
      "Afuera, la I-95 sigue rugiendo. Tito se sirve un café de máquina, lo mira un rato y no sabe por qué le dan ganas de llorar. Algo le falta, pero ya no sabe qué.",
      "Pero la cafetera, si uno escucha muy bien, todavía hace <em>tac — tac — tac … tac — tac</em>. Todavía hay tiempo de volver a intentarlo."
    ]
  }
};
