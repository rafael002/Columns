class SpriteSheet{
  construct(imagePath, frames, height, width){
    this.image = new Image();
    image.src = imagePath;
    this.height = height;
    this.width = width;
    this.frames = frames;
    this.frame = 0;
  }

  nextFrame(){
    if( this.frame == this.frames ){
      this.frame = 0;
      return false;
    }
    this.frame++;
  }
}
