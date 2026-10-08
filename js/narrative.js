// Textos del Game Master: dimensiones de la memoria, guardianes y efectos narrativos.
// Cada dimensión corresponde a un nivel de complejidad de la base de preguntas (1 → 9).

window.NARRATIVE = {
  intro: {
    title: "El Viaje de Tito",
    subtitle: "El Retorno a la Semilla",
    paragraphs: [
      "Miami, 11:47 de la noche. Desde el piso catorce, Tito mira la I-95: un río de luces que no lleva a ninguna parte. Tiene treinta y cinco años y una sospecha: algo le está borrando la isla por dentro. Los viejos del dominó le dicen <em>la Neblina del Norte</em>.",
      "Esa noche saca la vieja cafetera que se trajo de Cuba y la pone en la hornilla. El vapor no se disipa: se vuelve dorado, huele a salitre y tabaco, y se abre en la cocina como una puerta.",
      "—Tito —dice la cafetera con voz de abuela—, cruza y busca tus recuerdos. Llevas cinco fichas de dominó de nácar: cuídalas. Y no vas solo: contigo va tu <strong>Sangre Mambisa</strong>."
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
        "Tito pisa el muro del Malecón. Las olas cuelgan en el aire como cortinas de cristal verde, y en cada una duerme un recuerdo. Desde el Vedado avanza la Neblina, gris, con olor a gasolina. En el muro, un viejo de espuma de mar lo mira con ojos de caracol."
      ],

      again: [
        "La Neblina apaga los faroles uno a uno y un almendrón sin chofer se deshace en humo. El Pescador saca del aire, con su vara, una palabra brillante que se retuerce en el anzuelo."
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
        "El portal lo deja en el patio de un solar habanero. La ropa tendida baila sola y las paredes se repintan de rosado, pero por la escalera baja un frío de banco. Frente al fogón, una señora de pañuelo blanco cuela un café que nunca se acaba."
      ],

      again: [
        "Una puerta se cierra sola y una sábana blanca se vuelve gris y cae. Mamá Inés sopla el humo del café hacia la Neblina, como quien espanta un mosquito, y le sirve otra tacita."
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
        "Tito cae sobre un caballito de un carrusel oxidado. Los algodones de azúcar flotan como nubes, pero los caballitos se van volviendo grises, de plástico. Del carrusel se baja un muñeco de cartón con los cachetes pintados y lo mira con ojos de botón."
      ],

      again: [
        "La noria se detiene con un chirrido y las luces se vuelven fluorescentes de supermercado. Pin Pón le tira de la manga: ese altavoz es de la Neblina, no le hagas caso."
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
        "El portal se abre tras el mostrador de la bodega del barrio: pizarra con tiza, sacos de arroz, olor a jabón. Pero los estantes se llenan de cajas idénticas con códigos de barra. Un bodeguero de cuatro brazos grita: ¿quién es el último?"
      ],

      again: [
        "Una registradora digital aparece en el mostrador e imprime un ticket interminable; las señoras de la cola se vuelven transparentes. Cuco la tira a un saco de frijoles: aquí se paga con memoria."
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
        "Tito aparece en las murallas de La Cabaña al caer la tarde. La Habana prende sus luces, pero el cielo se pone gris de parqueo y el reloj marca una hora que no existe. Junto al cañón, un artillero de casaca roja sostiene una mecha que nunca se consume."
      ],

      again: [
        "La Neblina sube por la bahía como marea sucia y tapa la boca del cañón. La mecha chisporrotea azul, y en vez de campanas suena una alarma de carro que nadie apaga."
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
        "El portal es la puerta trasera de un Chevrolet del 57 por una Carretera Central infinita. Por las ventanillas pasan cañaverales y playas, pero cada vez que Tito parpadea se cuela un tramo del Palmetto. El chofer lo mira por el retrovisor: no me tires la puerta."
      ],

      again: [
        "El motor tose. En el radio el reguetón se corta y entra un locutor en inglés vendiendo seguros. Chicho le da un manotazo: échale otra respuesta al tanque, que vamos subiendo la loma."
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
        "El calor golpea primero. Tito está en medio de una conga santiaguera: corneta china, tambores, farolas girando. Pero donde pasa la Neblina la gente se queda quieta mirando el celular. Un diablito de rayas baila a su alrededor sin tocar el suelo."
      ],

      again: [
        "La corneta china desafina y se calla; una farola se apaga como un globo pinchado. El Diablito sacude sus campanitas: ¡eso no es carnaval, eso es un funeral de oficina!"
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
        "Viñales al amanecer: mogotes entre la neblina buena, la blanca, con olor a tierra colorada y tabaco. Pero del norte llega la gris, y donde toca los mogotes se vuelven edificios de cristal. En un bohío, un guajiro fuma un tabaco cuyo humo dibuja un caballo."
      ],

      again: [
        "La neblina gris trepa las lomas y un mogote se convierte en un condominio con piscina. El gallo se calla. El guajiro se sacude el sombrero: esa cosa no sabe lo que es una décima. Pero tú sí."
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
        "El último portal se desenrolla como una raíz. Tito está al pie de una ceiba más alta que Brickell, con raíces por toda la isla por donde corren ríos de recuerdos. La Neblina la rodea como un huracán gris. En la corteza se abre un rostro de abuela lleno de luz."
      ],

      again: [
        "El huracán aprieta y cada hoja que cae es un recuerdo que se apaga. De lejos llama el tráfico de la I-95. Las raíces le sostienen los tobillos: una más, mi niño. Dímela con el corazón."
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
      "Tito abre los ojos en su cocina de Miami, pero ya no es la misma: la I-95 le parece un Malecón de asfalto y el tráfico tiene tumbao de clave. Se sirve el café, llama a su sobrina y le dice: ven acá, que te voy a enseñar cómo termina Arroz con leche."
    ]
  },

  defeat: {
    title: "La Neblina se llevó la isla",
    paragraphs: [
      "La última ficha se vuelve polvo gris en la palma de Tito y el vapor se apaga como una vela. Está otra vez en su cocina, frente a una cafetera que no recuerda de dónde salió. Pero la cafetera, si uno escucha bien, todavía repica. Todavía hay tiempo de volver a intentarlo."
    ]
  }
};
