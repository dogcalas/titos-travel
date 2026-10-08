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
        "Mucho tiempo sin venir, muchacho. Este es el Malecón, donde las olas guardan los recuerdos. Pero la Neblina del Norte viene por el Vedado a borrarlos. A ver si te acuerdas de lo que te enseñó tu abuela."
      ],

      again: [
        "¿Viste? La Neblina ya apagó dos faroles. Acabo de pescar una palabra que se te estaba escapando. Agárrala rápido, antes de que se la trague el frío."
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
        "Ay, mijo, siéntate, que este es mi solar. Aquí el café no se acaba nunca y la ropa baila sola en la tendedera. Pero por la escalera baja un frío de banco. Antes de darte la tacita, dime una cosa."
      ],

      again: [
        "¿Oíste ese portazo? Es la Neblina. Esa cosa le tiene miedo al café fuerte y a la gente que se acuerda. Toma, otra tacita. Y contéstame esta."
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
        "¡Hola! Soy Pin Pón, y este es el parque de los caballitos. Mira cómo se están poniendo grises, de plástico. Si no te acuerdas de esto, el parque se cierra para siempre."
      ],

      again: [
        "¡La noria se paró! Y ese altavoz que habla en inglés es de la Neblina, no le hagas caso. Contéstame esta otra y la noria vuelve a girar."
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
        "¿Quién es el último? ¡Tú! Bienvenido a mi bodega: arroz, frijoles, jabón de lavar y la pizarra con tiza. Pero mira cómo se llenan los estantes de cajas con código de barra. Para que te despache, me tienes que contestar."
      ],

      again: [
        "¡Una caja registradora digital en mi mostrador! Mira cómo se transparentan las señoras de la cola. Aquí se paga con memoria, compadre. ¡Dale, otra, que la cola espera!"
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
        "Soldado, estás en las murallas de La Cabaña. Cada noche a las nueve disparo el cañonazo y La Habana cierra sus puertas. Pero el reloj marca una hora que no existe. Respóndeme, y yo disparo."
      ],

      again: [
        "La Neblina sube por la bahía y me está tapando la boca del cañón. La mecha chisporrotea azul. Otra respuesta, Sangre Mambisa, que esta ciudad lleva siglos cerrando a las nueve."
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
        "No me tires la puerta, ¿eh? Este Chevrolet del 57 camina con gasolina de recuerdos por la Carretera Central. Pero cada vez que parpadeas se cuela el Palmetto. Si no me contestas, nos quedamos botados."
      ],

      again: [
        "¿Oíste el motor toser? Y en el radio se metió un locutor en inglés vendiendo seguros. Échale otra respuesta al tanque, mi hermano, que estamos subiendo la loma."
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
        "¡Arriba, que esto es el carnaval de Santiago! Corneta china, tambores, farolas. Pero donde pasa la Neblina la gente se queda mirando el celular. Para entrar en la conga tienes que demostrar que eres de aquí."
      ],

      again: [
        "¡La corneta china se calló y una farola se apagó como un globo pinchado! Eso no es carnaval, eso es un funeral de oficina. ¡Contesta otra, que la conga necesita sangre!"
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
        "Siéntate, compay, que esto es Viñales al amanecer. La neblina blanca es la buena; la gris que viene del norte convierte los mogotes en edificios de cristal. Hay cosas que solo sabe el que se crió aquí."
      ],

      again: [
        "Mira eso: un mogote entero convertido en condominio con piscina, y el gallo que se calló a medio canto. Esa cosa no sabe lo que es una décima. Pero tú sí. A ver."
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
        "Has llegado hasta la semilla, mi niño. Soy la Ceiba, y mis raíces llegan a toda la isla. La Neblina me rodea como un huracán gris. Aquí no basta con acordarse un poquito: hay que ser cubano de pura cepa."
      ],

      again: [
        "Cada hoja que cae es un recuerdo que se apaga, y desde lejos te llama el tráfico de la I-95. Yo te sostengo. Una más, mi niño. Dímela con el corazón."
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
