import AnimatedBackground from "../../AnimatedBackground";

const VARIANTS = [
  "neon",
  "espaco",
  "cidade",
  "estudio",
  "particulas",
  "natureza",
  "tecnologia",
  "sala_gamer",
  "biblioteca",
  "futurista",
  "cidade_noturna",
];

export default function QuizBackground({ variant }) {
  return <AnimatedBackground variant={variant || "neon"} />;
}

export { VARIANTS };
