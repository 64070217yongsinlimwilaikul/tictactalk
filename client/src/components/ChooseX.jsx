import React from 'react';
import { motion } from 'framer-motion';

const ChooseX = ({ size, updateSquares, ind, customText }) => {

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
                <motion.line
                    x1="0"
                    y1="30"
                    x2="140"
                    y2="170"
                    stroke="white"
                    className="draw"
                />
                <motion.line
                    x1="5"
                    y1="170"
                    x2="140"
                    y2="30"
                    stroke="white"
                    className="draw"
                />
            </motion.svg>
            {customText && <div className="badge">
                {customText}
            </div>}
        </motion.div>
    );
};

export default ChooseX;

