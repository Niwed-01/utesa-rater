const adjectives = [
  "Astuto", "Audaz", "Breve", "Cauto", "Diestro", "Dulce", "Fiel", "Firme",
  "Fresco", "Frugal", "Gentil", "Grato", "Hábil", "Honesto", "Iluso", "Justo",
  "Leal", "Lento", "Libre", "Ligero", "Magno", "Noble", "Nuevo", "Pío", "Probable",
  "Pronto", "Puro", "Recto", "Sagaz", "Salvo", "Santo", "Sutil", "Tenaz", "Terso",
  "Triste", "Único", "Usual", "Valiente", "Vasto", "Veloz", "Versátil", "Vigoroso",
  "Agil", "Cálido", "Dócil", "Fértil", "Fútil", "Grácil", "Húmil", "Ilustre",
  "Inmune", "Integro", "Lúcido", "Magnánimo", "Nítido", "Plácido", "Próvido",
  "Púdico", "Rústico", "Sólido", "Tímido", "Vívido",
]

const nouns = [
  "Aguila", "Alce", "Alondra", "Armadillo", "Avestruz", "Ballena", "Bisonte",
  "Búho", "Camaleón", "Canario", "Canguro", "Castor", "Cebra", "Ciervo",
  "Cisne", "Cóndor", "Coyote", "Delfín", "Erizo", "Faisán", "Flamenco",
  "Foca", "Gacela", "Gavilán", "Golondrina", "Gorrión", "Guepardo", "Halcon",
  "Halcón", "Hiena", "Hipopotamo", "Hurón", "Jabali", "Jaguar", "Koala",
  "Lechuza", "Lémur", "Leopardo", "Lince", "Lirón", "Lobo", "Loro", "Luciérnaga",
  "Manatí", "Mangosta", "Mariposa", "Marmota", "Mirlo", "Morsa", "Nutria",
  "Pantera", "Pavo", "Perezoso", "Petirrojo", "Pingüino", "Puma", "Puma",
  "Quebranta", "Raton", "Reno", "Rinoceronte", "Ruiseñor", "Salamandra",
  "Saltamontes", "Serpiente", "Suricato", "Tapir", "Tejón", "Tiburón",
  "Tigre", "Topo", "Toro", "Tucán", "Urial", "Urraca", "Vaca", "Venado",
  "Vicuña", "Vizcacha", "Yaguar", "Zorro",
]

export function generarAlias(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}${noun}${num}`
}
