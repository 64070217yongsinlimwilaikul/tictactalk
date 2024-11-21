import React from 'react';
import { motion } from 'framer-motion';

const ChooseO = ({ size, updateSquares, ind, customText }) => {

    const handleClick = () => {
        if (!updateSquares) return;
        updateSquares(ind);
    };

    const selectSize = (size) => {
        if (size === undefined) return 1;
        let sizes = [0.3, 0.6, 1]
        return sizes[size]
    }

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleClick}
        >
            <motion.svg
                width="100"
                height="100"
                viewBox="-25 0 200 200"
                initial="hidden"
                animate="visible"
                style={{ transform: `scale(${selectSize(size)}, ${selectSize(size)})` }}
            >
                <motion.circle
                    cx="72.5"
                    cy="95"
                    r="70"
                    stroke="black"
                    className="draw"
                />
            </motion.svg>
            {customText && <div className="badge">
                {customText}
            </div>}
        </motion.div>
    );
};

export default ChooseO;

