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

function secureRandomInt(max: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

function randomHex(length: number): string {
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function generarAlias(): string {
  const adj = adjectives[secureRandomInt(adjectives.length)]
  const noun = nouns[secureRandomInt(nouns.length)]
  const suffix = randomHex(2)
  return `${adj}${noun}${suffix}`
}
