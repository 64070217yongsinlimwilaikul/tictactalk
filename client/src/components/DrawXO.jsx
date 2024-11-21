import { motion } from "framer-motion";
import "./DrawXO.css";

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i) => {
    const delay = i * 0.25;
    return {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay, type: "spring", duration: 0.2, bounce: 0 },
        opacity: { delay, duration: 0.01 }
      }
    };
  }
};

const DrawXO = ({ ind, updateSquares, clsName, size }) => {
  const handleClick = () => {
    updateSquares(ind);
  };
  const selectSize = (size) => {
    if (size === undefined) return 1;
    let sizes = [0.3, 0.6, 1];
    return sizes[size];
  }
  return (
    <motion.div

      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="square"
      onClick={handleClick}
    >
      {clsName && (
        <motion.svg
          key={size}
          width="100"
          height="100"
          viewBox="-25 0 200 200"
          initial="hidden"
          animate="visible"
          style={{ transform: `scale(${selectSize(size)}, ${selectSize(size)})` }}
        >
          {clsName === "x" ? (
            <>
              <motion.line
                x1="0"
                y1="30"
                x2="140"
                y2="170"
                stroke="white"
                variants={draw}
                custom={1}
                className="draw"
              />
              <motion.line
                x1="5"
                y1="170"
                x2="140"
                y2="30"
                stroke="white"
                className="draw"
                variants={draw}
                custom={1.5}
              />
            </>
          ) : (
            <motion.circle
              cx="72.5"
              cy="95"
              r="70"
              stroke="black"
              variants={draw}
              custom={1}
              className="draw"
            />
          )}
        </motion.svg>
      )}
    </motion.div>
  );
};

export default DrawXO;
