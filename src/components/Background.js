import React, { useEffect, useRef, useState } from 'react';



// Generate random points
function generatePoints(count, dimensions) {
    const newPoints = [];

    const numCells = dimensions.width * dimensions.height;
    const scale = Math.round(Math.sqrt(numCells / count));

    // create grid of points
    for (let i = 0; i < dimensions.height; i += scale) {
        const row = [];
        for (let j = 0; j < dimensions.width; j += scale) {
            row.push({
                x: j,
                y: i,
                originalX: j,
                originalY: i,
                velocityX: 0,  // Add velocity components
                velocityY: 0,
                friction: 0.95  // Add friction coefficient
            });
        }
        newPoints.push(row);
    }
    return newPoints;
}


var mousePos = { x: 0, y: 0 };
var mouseVelocity = { x: 0, y: 0 };
var lastMousePos = { x: 0, y: 0 };
var backgroundVarRenderItr = 0;
var backgroundVarRenderCache = [];

function Background() {
    const repelRadius = 50; // Distance at which points start being affected
    const repelStrength = 1; // How strongly points are pushed away
    const fadeRadius = 400; // Distance at which opacity starts to decrease
    const colorSpeed = 0.0001; // Speed of color change
    const maxVelocity = 2;  // Maximum velocity for points
    const inertia = 0.3;     // How much velocity is preserved
    const springStrength = 0.01;  // How strongly points are pulled together
    const restLength = 50;       // The natural length of the "spring" between points
    const numPoints = 500;
    const numCrawlers = 10;

    const canvasRef = useRef(null);
    const [points, setPoints] = useState(generatePoints(numPoints, { width: window.innerWidth, height: window.innerHeight }));
    const [crawlers, setCrawlers] = useState([]);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [prevDimensions, setPrevDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (prevDimensions.width !== window.innerWidth || prevDimensions.height !== window.innerHeight) {
                setPrevDimensions({ width: window.innerWidth, height: window.innerHeight });
                setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
                setPoints(generatePoints(numPoints, { width: window.innerWidth, height: window.innerHeight }));
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize points and start render loop
    useEffect(() => {
        // Render function
        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            // Clear canvas with a semi-transparent dark background
            ctx.clearRect(0, 0, dimensions.width, dimensions.height);

            ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';

            const time = Date.now() * colorSpeed;

            // Calculate current mouse speed
            const mouseSpeed = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y);
            const repelFactor = mouseSpeed;

            // Decay mouse velocity
            mouseVelocity.x *= 0.99;
            mouseVelocity.y *= 0.99;

            backgroundVarRenderItr += 1;

            let computeCache = false;
            if (backgroundVarRenderItr % 2 === 0 || backgroundVarRenderCache.length === 0) {
                backgroundVarRenderCache = [];
                computeCache = true;
            }


            // Update points position based on mouse
            const colors = [];
            for (let i = 0; i < points.length; i++) {
                const colorRow = [];
                const row = points[i];
                let cacheRow = [];
                if (!computeCache) {
                    cacheRow = backgroundVarRenderCache[i];
                }
                for (let j = 0; j < row.length; j++) {
                    const point = row[j];
                    const dx = point.x - mousePos.x;
                    const dy = point.y - mousePos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Calculate opacity based on distance
                    let opacity = Math.max(0.1, 0.9 - (distance / fadeRadius));

                    // Calculate forces
                    let totalForceX = 0;
                    let totalForceY = 0;

                    

                    if (computeCache) {
                        // Repulsion force
                        if (distance < repelRadius) {
                            const force = (repelRadius - distance) / repelRadius;
                            const angle = Math.atan2(dy, dx);
                            totalForceX += Math.cos(angle) * force * repelStrength * repelFactor;
                            totalForceY += Math.sin(angle) * force * repelStrength * repelFactor;
                        }

                        // Restoring force
                        const restoreForceX = (point.originalX - point.x) * 0.05;
                        const restoreForceY = (point.originalY - point.y) * 0.05;
                        totalForceX += restoreForceX;
                        totalForceY += restoreForceY;

                        // Sinusoidal motion
                        const motionTime = Date.now() * 0.0001;
                        totalForceX += Math.sin(motionTime + point.originalX * 0.01) * 0.5;
                        totalForceY += Math.sin(motionTime + point.originalY * 0.01) * 0.5;

                        // Add spring forces for connected points
                        if (j > 0) {  // Horizontal spring
                            const prevPoint = row[j - 1];
                            const dx = point.x - prevPoint.x;
                            const dy = point.y - prevPoint.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const displacement = distance - restLength;

                            // Calculate spring force
                            const force = displacement * springStrength;
                            const angle = Math.atan2(dy, dx);

                            // Apply force to both points
                            totalForceX -= Math.cos(angle) * force;
                            totalForceY -= Math.sin(angle) * force;

                            prevPoint.velocityX += Math.cos(angle) * force;
                            prevPoint.velocityY += Math.sin(angle) * force;
                        }

                        if (i > 0) {  // Vertical spring
                            const abovePoint = points[i - 1][j];
                            const dx = point.x - abovePoint.x;
                            const dy = point.y - abovePoint.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const displacement = distance - restLength;

                            // Calculate spring force
                            const force = displacement * springStrength;
                            const angle = Math.atan2(dy, dx);

                            // Apply force to both points
                            totalForceX -= Math.cos(angle) * force;
                            totalForceY -= Math.sin(angle) * force;

                            abovePoint.velocityX += Math.cos(angle) * force;
                            abovePoint.velocityY += Math.sin(angle) * force;
                        }

                        // Increase opacity if near crawler
                        for (let i = 0; i < crawlers.length; i++) {
                            const crawler = crawlers[i];
                            const dx = point.x - crawler.lastX;
                            const dy = point.y - crawler.lastY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            opacity = Math.max(opacity, 0.9 - (distance / 100));
                        }
                        cacheRow.push({ totalForceX, totalForceY, opacity });
                    } else {
                        totalForceX = cacheRow[j].totalForceX;
                        totalForceY = cacheRow[j].totalForceY;
                        opacity = cacheRow[j].opacity;
                    }


                    // Update velocity with all forces
                    point.velocityX = point.velocityX * point.friction + totalForceX * inertia;
                    point.velocityY = point.velocityY * point.friction + totalForceY * inertia;

                    // Limit maximum velocity
                    const currentVelocity = Math.sqrt(point.velocityX * point.velocityX + point.velocityY * point.velocityY);
                    if (currentVelocity > maxVelocity) {
                        const scale = maxVelocity / currentVelocity;
                        point.velocityX *= scale;
                        point.velocityY *= scale;
                    }

                    // Update position
                    point.x += point.velocityX;
                    point.y += point.velocityY;

                    // Calculate color based on position and time
                    const hue = (time * 360 + point.originalX * 0.1 + point.originalY * 0.1) % 360;
                    const saturation = 70;
                    const lightness = 50;

                    // render point with calculated color and opacity
                    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity * 0.8})`;
                    ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity * 0.4})`;
                    colorRow.push({ hue, saturation, lightness, opacity });

                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                    ctx.fill();

                    // render lines with color gradients
                    if (j > 0) {
                        const prevPoint = row[j - 1];
                        const gradient = ctx.createLinearGradient(point.x, point.y, prevPoint.x, prevPoint.y);
                        const prevHue = (time * 360 + prevPoint.originalX * 0.1 + prevPoint.originalY * 0.1) % 360;

                        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity * 0.4})`);
                        gradient.addColorStop(1, `hsla(${prevHue}, ${saturation}%, ${lightness}%, ${opacity * 0.4})`);

                        ctx.strokeStyle = gradient;
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(prevPoint.x, prevPoint.y);
                        ctx.stroke();
                    }

                    if (i > 0) {
                        const abovePoint = points[i - 1][j];
                        const gradient = ctx.createLinearGradient(point.x, point.y, abovePoint.x, abovePoint.y);
                        const aboveHue = (time * 360 + abovePoint.originalX * 0.1 + abovePoint.originalY * 0.1) % 360;

                        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity * 0.4})`);
                        gradient.addColorStop(1, `hsla(${aboveHue}, ${saturation}%, ${lightness}%, ${opacity * 0.4})`);

                        ctx.strokeStyle = gradient;
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(abovePoint.x, abovePoint.y);
                        ctx.stroke();
                    }
                }
                colors.push(colorRow);
            }

            ////////////// UPDATE CRAWLERS //////////////
            if (crawlers.length < numCrawlers) {
                const i = Math.floor(Math.random() * (points.length - 6)) + 3;
                const j = Math.floor(Math.random() * (points[i].length - 6)) + 3;
                setCrawlers([...crawlers, { x: j, y: i, nextX: j + 1, nextY: i + 1, percentDone: 1, lastX: j, lastY: i }]);
            }
            for (let i = 0; i < crawlers.length; i++) {
                const crawler = crawlers[i];

                // if crawler is out of bounds, remove it
                if (crawler.x < 0 || crawler.x >= colors[0].length || crawler.y < 0 || crawler.y >= colors.length || crawler.nextX < 0 || crawler.nextX >= colors[0].length || crawler.nextY < 0 || crawler.nextY >= colors.length) {
                    setCrawlers(crawlers.filter((_, index) => index !== i));
                    continue;
                }


                const color1 = colors[crawler.y][crawler.x];
                const color2 = colors[crawler.nextY][crawler.nextX];
                const p1 = points[crawler.y][crawler.x];
                const p2 = points[crawler.nextY][crawler.nextX];
                ctx.fillStyle = `hsla(${color1.hue}, ${color1.saturation}%, ${color1.lightness}%, ${1})`;
                ctx.strokeStyle = `hsla(${color2.hue}, ${color2.saturation}%, ${color2.lightness}%, ${1})`;
                ctx.beginPath();
                const centerX = (p1.x * (1 - crawler.percentDone) + p2.x * crawler.percentDone);
                const centerY = (p1.y * (1 - crawler.percentDone) + p2.y * crawler.percentDone);
                crawler.lastX = centerX;
                crawler.lastY = centerY;
                const radius = 7;
                ctx.moveTo(centerX, centerY);
                ctx.lineWidth = 2;
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();

                crawler.percentDone += 0.01;
                if (crawler.percentDone > 1) {
                    crawler.x = crawler.nextX;
                    crawler.y = crawler.nextY;
                    crawler.percentDone = 0;
                    if (Math.random() > 0.5) {
                        if (Math.random() > 0.5) {
                            crawler.nextX += 1;
                        }
                        else {
                            crawler.nextX -= 1;
                        }
                    }
                    else {
                        if (Math.random() > 0.5) {
                            crawler.nextY += 1;
                        }
                        else {
                            crawler.nextY -= 1;
                        }
                    }
                }
            }
        };

        // Set canvas size
        const canvas = canvasRef.current;
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        // Set up render interval
        const intervalId = setInterval(render, 70);

        return () => clearInterval(intervalId);
    }, [dimensions, points, crawlers]);

    useEffect(() => {
        const handleMouseMove = (event) => {
            // Calculate mouse velocity
            mouseVelocity.x = event.clientX - lastMousePos.x;
            mouseVelocity.y = event.clientY - lastMousePos.y;

            // Update positions
            lastMousePos.x = mousePos.x;
            lastMousePos.y = mousePos.y;
            mousePos.x = event.clientX;
            mousePos.y = event.clientY;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                backgroundColor: 'var(--bg-primary)',
                opacity: 0.5
            }}
        />
    );
}

export default Background; 