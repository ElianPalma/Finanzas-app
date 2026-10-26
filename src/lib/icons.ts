// Catálogo de iconos (nombres de Lucide en kebab-case) agrupados por tema.
// Formato de cada entrada: "nombre-del-icono|palabras clave para buscar".
// Si algún nombre no existe en la versión instalada de Lucide, el selector lo oculta solo.

export interface IconEntry {
  name: string;
  keywords: string;
}
export interface IconGroup {
  id: string;
  label: string;
  icons: IconEntry[];
}

const RAW: { id: string; label: string; items: string[] }[] = [
  {
    id: "hogar", label: "Hogar",
    items: [
      "house|casa vivienda hogar", "building|edificio apartamento", "building-2|edificio condominio oficina", "key-round|llave alquiler renta",
      "bed|cama dormitorio", "bed-double|cama matrimonial", "sofa|sofa sala muebles", "armchair|sillon muebles", "lamp|lampara", "lamp-desk|escritorio lampara",
      "bath|baño bañera", "shower-head|ducha baño", "toilet|inodoro baño", "refrigerator|nevera refrigerador", "washing-machine|lavadora lavanderia",
      "microwave|microondas", "cooking-pot|olla cocina", "hammer|martillo reparacion", "wrench|llave herramienta arreglo", "paintbrush|pintura brocha",
      "paint-roller|pintar pared", "trash-2|basura aseo", "fan|ventilador", "air-vent|aire acondicionado", "heater|calefaccion", "lightbulb|bombillo luz",
      "plug|enchufe", "fence|cerca", "door-open|puerta", "blinds|persianas cortinas", "spray-can|limpieza aerosol", "brush|cepillo limpieza",
    ],
  },
  {
    id: "comida", label: "Comida y bebida",
    items: [
      "utensils|comida cubiertos restaurante", "utensils-crossed|restaurante comer", "shopping-cart|supermercado compras mercado", "shopping-basket|cesta mercado compras",
      "shopping-bag|bolsa compras", "apple|manzana fruta", "banana|platano fruta", "carrot|zanahoria verdura", "cherry|cereza fruta", "grape|uvas fruta", "citrus|naranja limon fruta",
      "beef|carne res", "drumstick|pollo carne", "ham|jamon cerdo", "fish|pescado", "egg|huevo", "wheat|trigo cereal harina", "milk|leche", "croissant|pan panaderia",
      "sandwich|sandwich emparedado", "pizza|pizza", "soup|sopa", "salad|ensalada", "cookie|galleta", "cake|pastel torta", "cake-slice|pastel rebanada", "candy|dulce caramelo",
      "ice-cream-cone|helado antojo", "popcorn|canchita palomitas cine", "coffee|cafe", "cup-soda|refresco soda bebida", "beer|cerveza", "wine|vino", "martini|coctel trago",
      "glass-water|agua vaso", "baby|biberon bebe", "vegan|vegetal vegano", "nut|nueces frutos secos",
    ],
  },
  {
    id: "transporte", label: "Transporte",
    items: [
      "car|carro auto coche", "car-front|carro auto", "car-taxi-front|taxi", "bus|bus autobus colectivo", "bus-front|autobus", "bike|bicicleta", "train-front|tren metro",
      "tram-front|tranvia", "plane|avion vuelo", "plane-takeoff|avion vuelo", "ship|barco", "sailboat|velero", "truck|camion carga flete", "fuel|gasolina combustible",
      "circle-parking|estacionamiento parqueo", "route|ruta camino", "map-pin|ubicacion lugar", "navigation|navegacion gps", "rocket|cohete", "ambulance|ambulancia",
      "tractor|tractor agricultura", "forklift|montacargas", "cable-car|teleferico", "traffic-cone|cono transito", "gauge|velocimetro", "car-front|auto",
    ],
  },
  {
    id: "salud", label: "Salud",
    items: [
      "heart-pulse|salud corazon", "stethoscope|doctor medico consulta", "pill|pastilla medicina", "syringe|jeringa vacuna inyeccion", "tooth|diente dentista", "eye|ojo vista",
      "glasses|lentes gafas anteojos", "hospital|hospital clinica", "ambulance|emergencia ambulancia", "activity|pulso salud", "thermometer|termometro fiebre", "bandage|curita venda",
      "briefcase-medical|botiquin primeros auxilios", "cross|cruz medica", "brain|cerebro mente psicologia", "bone|hueso", "microscope|laboratorio examenes", "dumbbell|gimnasio ejercicio",
      "baby|bebe pediatra", "accessibility|discapacidad accesibilidad", "hand-heart|cuidado cariño", "heart-handshake|apoyo ayuda", "flask-conical|laboratorio", "test-tube|examen laboratorio",
      "ear|oido", "bed-pulse|hospitalizacion", "shield-plus|seguro medico", "scan-heart|chequeo",
    ],
  },
  {
    id: "educacion", label: "Educación",
    items: [
      "graduation-cap|graduacion universidad estudios", "school|escuela colegio", "book|libro", "book-open|libro leer", "library|biblioteca", "notebook|cuaderno", "notebook-pen|cuaderno apuntes",
      "pencil|lapiz escribir", "pen-line|boligrafo escribir", "backpack|mochila escolar", "languages|idiomas ingles", "calculator|calculadora matematica", "ruler|regla", "atom|ciencia fisica",
      "globe|mundo geografia", "flask-conical|quimica", "microscope|biologia", "presentation|presentacion clase", "award|diploma premio", "book-marked|libro marcado", "square-pen|escribir tarea",
      "laptop|computador estudio", "lamp-desk|estudiar", "baby|guarderia",
    ],
  },
  {
    id: "trabajo", label: "Trabajo y negocio",
    items: [
      "briefcase|trabajo maletin empleo", "store|tienda negocio local", "building-2|empresa oficina", "factory|fabrica industria", "hard-hat|construccion obrero", "shovel|pala obra", "pickaxe|mineria",
      "scissors|peluqueria barberia", "truck|reparto transporte carga", "package|paquete mercaderia", "boxes|cajas inventario", "clipboard-list|lista pedidos", "printer|impresora", "monitor|monitor computador",
      "handshake|acuerdo trato", "users|equipo personas", "id-card|identificacion carnet", "file-text|documento papeles tramites", "files|documentos", "folder|carpeta", "stamp|sello notaria",
      "chef-hat|cocinero gastronomia", "wrench|mecanico taller", "drill|taladro", "paintbrush|pintor", "warehouse|almacen bodega", "container|contenedor", "tags|etiquetas precios",
      "badge-check|certificado", "megaphone|publicidad", "presentation|presentacion",
    ],
  },
  {
    id: "servicios", label: "Servicios",
    items: [
      "wifi|internet", "zap|electricidad luz", "droplets|agua", "droplet|agua gota", "smartphone|telefono celular movil", "phone|telefono fijo", "tv|television streaming", "monitor-play|streaming video",
      "satellite-dish|cable antena satelite", "router|router modem internet", "flame|gas fuego", "radio|radio", "cloud|nube suscripcion", "mail|correo", "trash-2|aseo basura",
      "shield-check|seguro", "lock|seguridad alarma candado", "siren|alarma emergencia", "plug-zap|energia", "cable|cable", "battery-charging|bateria carga", "sun|energia solar", "wind|viento",
      "mailbox|buzon correo", "package-check|encomienda envio",
    ],
  },
  {
    id: "dinero", label: "Dinero y finanzas",
    items: [
      "banknote|billete dinero efectivo", "hand-coins|dinero mano pago", "coins|monedas", "piggy-bank|ahorro alcancia", "landmark|banco", "credit-card|tarjeta credito debito", "wallet|billetera cartera",
      "receipt|recibo factura gasto", "circle-dollar-sign|dolar dinero", "badge-dollar-sign|dolar", "dollar-sign|dolar", "percent|porcentaje interes", "trending-up|ganancia sube inversion", "trending-down|baja perdida",
      "chart-line|grafico inversion", "chart-pie|grafico presupuesto", "chart-bar|grafico barras", "scale|balanza justicia legal", "calculator|calculo cuentas", "hand-helping|ayuda prestamo",
      "handshake|prestamo acuerdo", "safe|caja fuerte", "gem|joya lujo", "vault|boveda ahorro", "receipt-text|impuestos", "file-text|contrato", "bitcoin|criptomoneda", "arrow-left-right|transferencia cambio",
      "history|saldo anterior historial", "gift|regalo bono",
    ],
  },
  {
    id: "familia", label: "Familia y niños",
    items: [
      "baby|bebe", "users|familia grupo", "user|persona", "user-round|persona", "smile|feliz", "heart|amor familia", "heart-handshake|apoyo", "hand-heart|cuidado", "gift|regalo",
      "puzzle|juego rompecabezas", "blocks|bloques juguetes", "toy-brick|juguetes lego", "shirt|ropa", "rocking-chair|abuelos adulto mayor", "cake|cumpleaños", "party-popper|fiesta", "baby|pañales",
      "bike|bicicleta niños", "school|escuela", "backpack|mochila", "teddy-bear|peluche", "venus|mujer", "mars|hombre", "users-round|familia", "house-heart|hogar familia", "ribbon|lazo",
    ],
  },
  {
    id: "mascotas", label: "Mascotas y animales",
    items: [
      "dog|perro", "cat|gato", "paw-print|huella mascota", "bird|ave pajaro", "fish|pez pescado", "rabbit|conejo", "turtle|tortuga", "squirrel|ardilla", "bone|hueso perro",
      "worm|gusano", "bug|insecto", "snail|caracol", "rat|rata", "feather|pluma", "egg|huevo gallina", "beef|vaca ganado", "milk|leche ganaderia", "shrimp|camaron", "origami|animal",
    ],
  },
  {
    id: "ocio", label: "Ocio y entretenimiento",
    items: [
      "gamepad-2|videojuegos consola", "clapperboard|cine pelicula", "film|pelicula", "popcorn|cine", "music|musica", "headphones|audifonos musica", "guitar|guitarra", "mic|microfono karaoke",
      "ticket|entrada boleto concierto", "drama|teatro", "dices|dados juegos mesa", "palette|arte pintura", "camera|fotografia camara", "tv|television", "book-open|lectura", "puzzle|rompecabezas",
      "disc-3|disco musica", "radio|radio", "party-popper|fiesta", "martini|fiesta bar", "beer|cerveza bar", "tent|campamento", "mountain|montaña senderismo", "binoculars|observar",
      "fish|pesca", "club|cartas naipes", "spade|cartas", "swords|juego", "joystick|videojuego", "theater|teatro", "projector|proyector cine", "drum|tambor musica", "piano|piano",
    ],
  },
  {
    id: "deporte", label: "Deporte",
    items: [
      "dumbbell|gimnasio pesas", "trophy|trofeo competencia", "medal|medalla", "bike|ciclismo bicicleta", "footprints|caminar correr", "goal|futbol gol", "target|punteria objetivo", "volleyball|voleibol",
      "swords|esgrima", "waves|natacion piscina playa", "mountain-snow|montaña nieve", "flag|bandera meta", "timer|cronometro", "person-standing|persona", "activity|actividad", "heart-pulse|cardio",
      "shirt|uniforme camiseta", "tent|camping", "sailboat|vela", "snowflake|esqui nieve",
    ],
  },
  {
    id: "ropa", label: "Ropa y cuidado personal",
    items: [
      "shirt|camisa ropa", "scissors|peluqueria corte", "sparkles|belleza brillo", "gem|joyas", "watch|reloj", "glasses|lentes", "crown|corona", "footprints|zapatos calzado", "brush|cepillo maquillaje",
      "spray-can|perfume spray", "bath|aseo baño", "droplets|crema higiene", "flower-2|flor", "hand|manos manicure", "smile|dientes sonrisa", "ribbon|lazo accesorio", "umbrella|paraguas",
      "hat-glove|gorro", "venus|mujer", "mars|hombre", "sun|protector solar", "moon|noche", "heart|autocuidado",
    ],
  },
  {
    id: "celebraciones", label: "Eventos y celebraciones",
    items: [
      "party-popper|fiesta celebracion", "gift|regalo", "cake|cumpleaños pastel", "cake-slice|cumpleaños", "tree-pine|navidad arbol pino", "snowflake|navidad invierno", "sparkles|año nuevo estreno brillo",
      "sparkle|estrella brillo", "star|estrella", "heart|san valentin amor", "flower-2|dia de la madre flores", "flower|flor", "church|iglesia misa", "cross|religion cruz", "moon|ramadan luna", "sun|verano",
      "ghost|halloween", "bell|campana aviso", "bell-ring|campana", "calendar-heart|fecha especial", "calendar-days|calendario", "calendar-check|cita", "candy|dulces", "wine|brindis", "martini|brindis",
      "music|baile musica", "popcorn|reunion", "gem|aniversario anillo", "baby|baby shower", "graduation-cap|graduacion", "rose|rosa", "heart-handshake|boda union", "shirt|estreno ropa", "bike|regalo bicicleta",
      "toy-brick|regalo juguete", "candy-cane|navidad", "drumstick|cena navideña", "wine|cena", "fireworks|fuegos artificiales", "tent|campamento",
    ],
  },
  {
    id: "viajes", label: "Viajes y turismo",
    items: [
      "plane|avion vuelo viaje", "plane-takeoff|vuelo", "luggage|maleta equipaje", "map|mapa", "map-pin|lugar destino", "compass|brujula", "tent|camping", "hotel|hotel hospedaje", "camera|fotos",
      "ship|crucero barco", "umbrella|playa sombrilla", "tree-palm|playa palmera", "mountain|montaña", "globe|mundo internacional", "passport|pasaporte", "ticket|boleto pasaje", "train-front|tren",
      "bus|bus", "car|carretera", "sailboat|velero", "waves|mar playa", "sunset|atardecer", "landmark|monumento", "castle|castillo", "backpack|mochila viaje", "earth|mundo",
    ],
  },
  {
    id: "tecnologia", label: "Tecnología",
    items: [
      "laptop|computador portatil", "smartphone|celular", "tablet|tableta", "monitor|monitor pantalla", "keyboard|teclado", "mouse|raton mouse", "cpu|procesador", "hard-drive|disco duro", "headphones|audifonos",
      "printer|impresora", "gamepad-2|consola", "watch|reloj inteligente", "camera|camara", "router|router", "wifi|wifi", "server|servidor", "code|programacion", "globe|web dominio", "cloud|nube",
      "usb|memoria usb", "battery-charging|cargador", "bluetooth|bluetooth", "speaker|bocina parlante", "tv|televisor", "plug|enchufe", "bot|robot", "app-window|aplicacion", "circuit-board|electronica",
    ],
  },
  {
    id: "naturaleza", label: "Naturaleza y campo",
    items: [
      "sprout|siembra planta", "leaf|hoja", "trees|bosque", "tree-deciduous|arbol", "flower-2|jardin flores", "tractor|campo agricultura", "shovel|jardineria", "wheat|cultivo cereal", "carrot|huerto",
      "droplets|riego agua", "sun|sol", "cloud-rain|lluvia", "snowflake|nieve", "wind|viento", "flame|fuego leña", "mountain|montaña", "waves|rio mar", "fish|pesca", "bird|aves", "recycle|reciclaje",
      "cloud-sun|clima", "rainbow|arcoiris", "tent-tree|campo",
    ],
  },
  {
    id: "otros", label: "Otros",
    items: [
      "circle-help|otro desconocido", "tag|etiqueta", "star|favorito", "bookmark|marcador", "archive|archivo", "box|caja", "package|paquete", "repeat|repetir", "sparkles|especial", "triangle-alert|imprevisto alerta",
      "shield-check|seguro proteccion", "life-buoy|ayuda salvavidas", "lightbulb|idea", "flag|meta", "target|objetivo", "infinity|infinito", "puzzle|varios", "layers|capas", "grid-2x2|general", "heart|favorito",
      "smile|feliz", "thumbs-up|bien", "badge-help|pregunta", "hand-coins|pago", "shopping-bag|compras", "umbrella|imprevistos", "key-round|llave", "cross|cruz",
    ],
  },
];

export const ICON_GROUPS: IconGroup[] = RAW.map((g) => ({
  id: g.id,
  label: g.label,
  icons: g.items.map((s) => {
    const [name, keywords = ""] = s.split("|");
    return { name, keywords };
  }),
}));

// Lista sin repetidos (el primer grupo donde aparece conserva sus palabras clave)
export const ALL_ICONS: IconEntry[] = (() => {
  const seen = new Set<string>();
  const out: IconEntry[] = [];
  for (const g of ICON_GROUPS) {
    for (const i of g.icons) {
      if (!seen.has(i.name)) {
        seen.add(i.name);
        out.push(i);
      }
    }
  }
  return out;
})();

export const normalizeText = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
