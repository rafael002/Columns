
/**
 * Created by rafaellourenco on 3/13/18.
 */
class Search{
    constructor( matrix_x, matrix_y ){
        this.x = matrix_x;
        this.y = matrix_y;

        this.matrix = [];
        // create the second dimension of matrix
        for(let i = 0; i < this.y; i++){
            this.matrix[i] = [];
        }
        // set the initial values
        for(let i = 0; i < this.y; i++){
            for(let j = 0; j < this.x; j++){
                this.matrix[i][j] = 0;
            }
        }
    }

    generatePattern( ScreenMap ){
        let alter = 0;
        for(let i = 0; i < this.y; i++){
            alter = !alter;
            for(let j = 0; j < this.x; j++){
                if( alter ){
                    ScreenMap[i][j] = 9;
                    alter = 0;
                }else{
                    alter = 1;
                }
            }
        }
    }

    move(y, x, x_speed, y_speed, map ){

        // HORIZONTAL LIMITS
        if((x_speed === 1 && x === this.x) || ( x_speed === -1 && x < 1 )){
            return false;
        }

        // VERTICAL LIMITS
        if((y_speed === 1 && y === this.x) || ( y_speed === -1 && y < 1 )){
            return false;
        }

        // TODO fix the algorithm
        do{
            if( map[x][y] !== 9){
                return false
            }
            map[x][y] = 1;
            this.move(x+x_speed, y+y_speed, x_speed, y_speed, map);
        }while(true);
    }

    analyse( screenMap ){
        if( screenMap.analize ){
            console.log('teste');
            for(let i = 0; i < this.y; i++){
                for(let j = 0; j < this.x; j++){
                    this.move(j, i, 1, 1, screenMap);
                }
            }
        }
    }
}