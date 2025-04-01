export function drawSpaceship(ctx, x, y, width, height) {
  // Spaceship body
  ctx.fillStyle = '#3498db';
  
  // Draw a triangular spaceship
  ctx.beginPath();
  ctx.moveTo(x + width, y + height / 2); // Nose of the ship
  ctx.lineTo(x, y); // Top-left
  ctx.lineTo(x, y + height); // Bottom-left
  ctx.closePath();
  ctx.fill();
  
  // Engines
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.rect(x, y + height * 0.2, width * 0.1, height * 0.2);
  ctx.rect(x, y + height * 0.6, width * 0.1, height * 0.2);
  ctx.fill();
  
  // Window
  ctx.fillStyle = '#f39c12';
  ctx.beginPath();
  ctx.arc(x + width * 0.7, y + height * 0.5, width * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawMeteor(ctx, x, y, size) {
  ctx.fillStyle = '#7f8c8d';
  
  // Draw the main meteor body
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw some craters for detail
  ctx.fillStyle = '#95a5a6';
  const craterPositions = [
    { x: 0.3, y: 0.3, size: 0.15 },
    { x: 0.7, y: 0.5, size: 0.1 },
    { x: 0.4, y: 0.7, size: 0.12 }
  ];
  
  craterPositions.forEach(crater => {
    ctx.beginPath();
    ctx.arc(
      x + size * crater.x,
      y + size * crater.y,
      size * crater.size,
      0, Math.PI * 2
    );
    ctx.fill();
  });
}

export function drawEnemyShip(ctx, x, y, width, height) {
  // Enemy ship body
  ctx.fillStyle = '#e74c3c';
  
  // Draw a different shape for enemy ships
  ctx.beginPath();
  ctx.moveTo(x, y + height / 2); // Nose of the ship
  ctx.lineTo(x + width, y); // Top-right
  ctx.lineTo(x + width, y + height); // Bottom-right
  ctx.closePath();
  ctx.fill();
  
  // Details
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.rect(x + width * 0.6, y, width * 0.2, height);
  ctx.fill();
  
  // Window
  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.arc(x + width * 0.3, y + height * 0.5, width * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPitchIndicator(ctx, canvas, cents) {
  const centerY = canvas.height / 2;
  const indicatorSize = 10;
  
  // Draw pitch guidelines
  ctx.lineWidth = 1;
  
  // Middle line (in tune)
  ctx.strokeStyle = '#2ecc71';
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.stroke();
  
  // Top line (quarter tone sharp)
  ctx.strokeStyle = '#f39c12';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, 0);
  ctx.stroke();
  
  // Bottom line (quarter tone flat)
  ctx.strokeStyle = '#f39c12';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();
  
  // Text labels
  ctx.font = '12px Arial';
  ctx.fillStyle = '#2ecc71';
  ctx.fillText('In Tune', 10, centerY - 5);
  
  ctx.fillStyle = '#f39c12';
  ctx.fillText('Quarter Tone Sharp', 10, 15);
  ctx.fillText('Quarter Tone Flat', 10, canvas.height - 5);
  
  // If we have cents data, show the current pitch position
  if (cents !== null && !isNaN(cents)) {
    // Map cents (-50 to +50) to Y position (bottom to top of canvas)
    const targetY = canvas.height * (1 - ((cents + 50) / 100));
    
    // Draw pitch indicator on right side
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.arc(canvas.width - 20, targetY, indicatorSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Add text showing cents value
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(cents > 0 ? `+${cents}` : cents, canvas.width - 20, targetY + 4);
    ctx.textAlign = 'left'; // Reset to default
  }
}