import React from 'react';

import FieldMaker from './FieldMaker';
import IsabelleMaker from './IsabelleMaker/index';
import FlowerExplainer from './FlowerExplainer';
import FlowerCrosser from './FlowerCrosser';

function App() {
  const hash = window.location.hash;
  return <>
    {hash === '' && <FieldMaker/>}
    {hash === '#isabelle' && <IsabelleMaker/>}
    {hash === '#explain' && <FlowerExplainer/>}
    {hash === '#crosser' && <FlowerCrosser/>}
    {hash === '#favchecker' && <div>
      favchecker <a href="/favchecker">has moved</a>
    </div>}
  </>;
}
export default App;
