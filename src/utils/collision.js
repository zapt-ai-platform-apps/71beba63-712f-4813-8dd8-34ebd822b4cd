export function checkCollision(spaceship, obstacle) {
  // For circular obstacle and triangular spaceship, use a simpler rectangle collision
  return (
    spaceship.x < obstacle.x + obstacle.width &&
    spaceship.x + spaceship.width > obstacle.x &&
    spaceship.y < obstacle.y + obstacle.height &&
    spaceship.y + spaceship.height > obstacle.y
  );
}