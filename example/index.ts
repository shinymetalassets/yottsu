import {
  Widget
} from '@phosphor/widgets';

import {
  Life
} from '../src';


window.addEventListener('load', function () {
  const main = document.querySelector('main') as HTMLElement;
  const model = (window as any).model = new Life.Model({
    initial: Life.Model.random(50, 100),
    interval: 50
  });
  const grid = Life.create(model, { size: 10 });

  main.style.height = `${grid.bodyHeight}px`;
  main.style.width = `${grid.bodyWidth}px`;
  main.style.display = 'block';
  Widget.attach(grid, main);
  model.start();
});
