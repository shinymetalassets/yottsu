import {
  DataGrid, DataModel, TextRenderer
} from '@phosphor/datagrid';

import '../style/index.css';


/**
 * The default likelihood that a random cell is alive.
 */
const LIKELIHOOD = 0.25;

/**
 * The default number of rows in a randomly generated world.
 */
const ROWS = 40;

/**
 * The default number of columns in a randomly generated world.
 */
const COLUMNS = 40;

/**
 * The default time (in ms) between generations and rendering.
 */
const INTERVAL = 250;

export
namespace Life {
  export
  interface IStyle {
    alive?: string;
    empty?: string;
    size?: number;
  }

  export
  class Model extends DataModel {

    constructor(options: Model.IOptions = { }) {
      super();
      this._interval = options.interval || INTERVAL;
      this._tick = options.tick || Model.tick;
      this.state = options.initial || Model.random();
    }

    /**
     * The current state of the universe.
     */
    get state(): Model.Bit[][] {
      return this._data;
    }
    set state(state: Model.Bit[][]) {
      if (this._started) {
        this.stop();
      }
      this._data = state;
      this._swap = JSON.parse(JSON.stringify(state));
    }

    rowCount(region: DataModel.RowRegion): number {
      return this._data.length;
    }

    columnCount(region: DataModel.ColumnRegion): number {
      return this._data[0].length;
    }

    data(region: DataModel.CellRegion, row: number, column: number): any {
      return this._data[row][column];
    }

    /**
     * Start ticking the life widget, rendering each generation.
     */
    start(): void {
      let swap = false;

      if (this._started) {
        this.stop();
      }

      this._started = window.setInterval(() => {
        // Use a pointer to swap lists back so their names make semantic sense.
        if (swap = !swap) {
          let swapped = this._data;
          this._data = this._swap;
          this._swap = swapped;
        }

        this._tick(this._swap, this._data);
        this.emitChanged({
          type: 'cells-changed',
          rowSpan: this._data.length,
          columnSpan: this._data[0].length,
          region: 'body',
          rowIndex: 0,
          columnIndex: 0
        });
      }, this._interval);
    }

    /**
     * Stop ticking the life widget.
     */
    stop(): void {
      if (this._started) {
        window.clearInterval(this._started);
        this._started = 0;
      }
    }

    private _interval: number;
    private _data: Model.Bit[][];
    private _swap: Model.Bit[][];
    private _started: number;
    private _tick: Model.Tick;
  }


  /**
   * A namespace for `Model` statics.
   */
  export
  namespace Model {
    /**
     * The basic unit of life, `1` represents life.
     */
    export
    type Bit = 1 | 0;

    /**
     * The tick function type for calculating new generations of life.
     */
    export
    type Tick = (prev: Bit[][], next: Bit[][], fluctuation?: number) => void;

    /**
     * The instantiation options for a life widget.
     */
    export
    interface IOptions {
      /**
       * The initial state of the universe, defaults to a random world.
       */
      initial?: Bit[][];

      /**
       * The time (in ms) between generations and rendering, defaults to `250`.
       */
      interval?: number;

      /**
       * A function used to calculate generations, defaults to `LifeWidget.tick`.
       */
      tick?: Tick;
    }

    /**
     * Generates a random data set to initialize the state of the world.
     *
     * @param rows - The number of rows in the data, defaults to `40`.
     *
     * @param columns - The number of columns in the data, defaults to `40`.
     *
     * @param likelihood - The likelihood of a live cell, defaults to `0.25`.
     *
     * @returns A two-dimensional array representing the state of the world.
     */
    export
    function random(rows = ROWS, columns = COLUMNS, likelihood = LIKELIHOOD): Bit[][] {
      const data = [];

      for (let i = 0; i < rows; i += 1) {
        let row: Bit[] = [];

        data.push(row);

        for (let j = 0; j < columns; j += 1) {
          row[j] = Math.random() < likelihood ? 1 : 0;
        }
      }

      return data;
    }

    /**
     * Process a generation of life following Conway's original rules.
     *
     * @param input - The current state of the world.
     *
     * @param output - An array that will be populated with the next generation.
     *
     * @param fluctuation - An optional value between 0 and 1 that indicates the
     * likelihood that a bit will flip, contravening the rules.
     *
     * #### Notes
     * Instead of accepting a single state array, this function takes an `input`
     * and an `output` array to facilitate swapping back and forth between
     * generation arrays without needing to reallocate memory. The `input` and
     * `output` arrays must have the same dimensions.
     */
    export
    function tick(input: Bit[][], output: Bit[][], fluctuation = 0): void {
      const rows = input.length;
      const columns = input[0].length;
      const lastCol = columns - 1;
      const lastRow = rows - 1;

      for (let i = 0; i < rows; i += 1) {
        for (let j = 0; j < columns; j += 1) {
          let alive = input[i][j];
          let cell: Bit = 0;
          let decX = i >= 1 ? i - 1 : lastRow;      // decrement x
          let decY = j >= 1 ? j - 1 : lastCol;      // decrement y
          let incX = i + 1 <= lastRow ? i + 1 : 0;  // increment x
          let incY = j + 1 <= lastCol ? j + 1 : 0;  // increment y
          let neighbors = input[decX][decY] +
                          input[   i][decY] +
                          input[incX][decY] +
                          input[decX][   j] +
                          input[incX][   j] +
                          input[decX][incY] +
                          input[   i][incY] +
                          input[incX][incY];

          // Any live cell with fewer than two live neighbors dies.
          // Any live cell with two or three live neighbors lives.
          // Any live cell with more than three live neighbors dies.
          // Any dead cell with exactly three live neighbors becomes a live cell.
          if (alive && neighbors < 2) { cell = 0; }
          else if (alive && neighbors === 2 || neighbors === 3) { cell = 1; }
          else if (alive && neighbors > 3) { cell = 0; }
          else if (!alive && neighbors === 3) { cell = 1; }

          // If there is a fluctuation, flip the cell value.
          if (fluctuation && Math.random() < fluctuation) {
            cell = 1 - cell as Bit;
          }

          output[i][j] = cell; // Record the tick value.
        }
      }
    }
  }

  export
  function create(model: Model, style: IStyle = { }): DataGrid {
    const grid = new DataGrid({
      baseColumnSize: style.size || 9,
      baseRowSize: style.size || 9,
      headerVisibility: 'none',
      style: {
        ...DataGrid.defaultStyle,
        gridLineColor: `rgba(255, 255, 255, 0.5)`,
        voidColor: 'transparent'
      }
    });
    const renderer = new TextRenderer({
      backgroundColor: ({ value }) => {
        return value === 1 ? style.alive || `rgb(0, 0, 0)`
          : style.empty || `rgb(50, 185, 25)`;
      },
      format: () => ''
    });

    grid.model = model;
    grid.addClass('ad-Life');
    grid.cellRenderers.set('body', { }, renderer);

    return grid;
  }
}
