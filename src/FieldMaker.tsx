import React, { useState, useRef } from 'react';
import styled, { css, keyframes } from 'styled-components';

import { FlowerNames, Genes, SeedGenes } from './data/genes';
import { FlowerIconPaths } from './data/flowericonpaths';

import SuzuranImage from './img/Suzuran.png';
import SuzuranWhiteImage from './img/Suzuran_w.png';
import ClothIcon from './img/Icon_GeneralCloth_00^t.png';
import TrashIcon from './img/ProfileReplaceIcon^t.png';
import ScoopIcon from './img/Scoop.png';
import RoadTexture from './img/RoadTexC^_A.png';
import GrassTexture from './img/AnimalPatternColor^_D.png';
import CliffIcon from './img/RoadCreationIconCriff^w.png';
import CliffFloorWall from './img/IconCatFloorWall^s.png';
import CliffSpriteTop from './img/cliff_top.png';
import CliffSpriteLeft from './img/cliff_left.png';
import CliffSpriteRight from './img/cliff_right.png';
import CliffSpriteBottom from './img/cliff_bottom.png';
import CliffSpriteTopRight from './img/cliff_topright.png';
import CliffSpriteTopLeft from './img/cliff_topleft.png';
import CliffSpriteBottomRight from './img/cliff_bottomright.png';
import CliffSpriteBottomLeft from './img/cliff_bottomleft.png';
import CliffSpriteInsetTopRight from './img/cliff_inset_topright.png';
import CliffSpriteInsetTopLeft from './img/cliff_inset_topleft.png';
import CliffSpriteInsetBottomRight from './img/cliff_inset_bottomright.png';
import CliffSpriteInsetBottomLeft from './img/cliff_inset_bottomleft.png';

interface Field {
  [key: number]: {
    [key: number]: Flower | undefined
  }
}
interface BlockField {
  [key: number]: {
    [key: number]: Blockers
  }
}
interface ElevationField {
  [key: number]: {
    [key: number]: number
  }
}

enum Blockers {
  PAVEMENT = 1,
  LILYOFTHEVALLEY = 2,
  CLIFF = 3,
  CLIFF_INVERT = 4,
}
interface Flower {
  species: FlowerNames
  genes: string
}

const cellSize = 50;
const bevelWidth = 0;

const FieldMaker = () => {
  const [fieldWidth, setFieldWidth] = useState(10);
  const [fieldHeight, setFieldHeight] = useState(10);

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(undefined as Blockers | undefined);
  const [flowerSpecies, setFlowerSpecies] = useState(FlowerNames.rose);
  const [flowerGenes, setFlowerGenes] = useState('11 112 11 00');
  const [field, setField] = useState({} as Field);
  const [blockField, setBlockField] = useState({} as BlockField);
  const [viewPerspective, setViewPerspective] = useState(false);
  const [viewBevel, setViewBevel] = useState(true);
  const thisBevelWidth = viewBevel ? bevelWidth : 0;
  const rows = [];

  const [hoverCol, setHoverCol] = useState(0);
  const [hoverRow, setHoverRow] = useState(0);
  const [elevation, setElevation] = useState({} as ElevationField);

  for (let x = 0; x < fieldHeight; x++) {
    const row = [];
    for (let y = 0; y < fieldWidth; y++){ 
      row.push(1);
    }
    rows.push(row);
  }

  const flowerOptions = Object.keys(SeedGenes).map(k => Number(k) as FlowerNames);
  const colorOptions: { [key: string]: string } = Object.entries(Genes[flowerSpecies]).reduce((c, n) => {
    if (!c[n[1]]) {
      c[n[1]] = n[0];
    }
    return c;
  }, {} as { [key: string]: string });

  const onClickCell = (rowIndex: number, colIndex: number, isRightClick?: boolean) => {
    return (e: React.MouseEvent) => {
      if (isBlocking === Blockers.CLIFF || isBlocking === Blockers.CLIFF_INVERT) {
        const newElevation = { ...elevation };
        if (!newElevation[rowIndex]) {
          newElevation[rowIndex] = {};
        }
        const isGoingUp = (isBlocking === Blockers.CLIFF && !isRightClick) || (isBlocking === Blockers.CLIFF_INVERT && isRightClick);
        const newLevel = isGoingUp
          ? Math.min(2, (newElevation[rowIndex][colIndex] || 0) + 1)
          : Math.max(0, (newElevation[rowIndex][colIndex] || 0) - 1);
        newElevation[rowIndex][colIndex] = newLevel;
        setElevation(newElevation);
      } else if (isBlocking !== undefined) {
        const newBlockField = {...blockField};
        if (!newBlockField[rowIndex]) {
          newBlockField[rowIndex] = {};
        }
        if (newBlockField[rowIndex][colIndex] !== isBlocking) {
          newBlockField[rowIndex][colIndex] = isBlocking;
        } else {
          delete newBlockField[rowIndex][colIndex];
        }
        setBlockField(newBlockField);
      } else {
        const newField = {...field};
        if (!newField[rowIndex]) {
          newField[rowIndex] = {};
        }
        if (!newField[rowIndex][colIndex]) {
          newField[rowIndex][colIndex] = {
            species: flowerSpecies,
            genes: flowerGenes,
          };
        } else {
          newField[rowIndex][colIndex] = undefined;
        }
        setField(newField);
      }

      if (isRightClick) {
        e.preventDefault();
        return false;
      }
    };
  };

  const currentColor = resolveFlowerColor({
    species: flowerSpecies,
    genes: flowerGenes,
  });

  const fieldElKeypressHandler = (e: React.KeyboardEvent<HTMLDivElement>) => {
    return;
    // 113 q, 119 w
    if (String.fromCharCode(e.which).toLowerCase() === 'q') {
      const newElevation = { ...elevation };
      if (!newElevation[hoverRow]) {
        newElevation[hoverRow] = {};
      }
      const newLevel = Math.min(2, (newElevation[hoverRow][hoverCol] || 0) + 1);
      newElevation[hoverRow][hoverCol] = newLevel;
      setElevation(newElevation);
    }
    if (String.fromCharCode(e.which).toLowerCase() === 'w') {
      const newElevation = { ...elevation };
      if (!newElevation[hoverRow]) {
        newElevation[hoverRow] = {};
      }
      newElevation[hoverRow][hoverCol] = Math.max(0, (newElevation[hoverRow][hoverCol] || 0) - 1);
      setElevation(newElevation);
    }
  };

  const fakeCursorRef = useRef(null as null | HTMLDivElement);
  const updateCursor = (e: React.MouseEvent) => {
    const cursorEl = fakeCursorRef.current;
    if (!cursorEl) {
      return;
    }
    cursorEl.style.transform = `
      translateX(${e.clientX}px)
      translateY(${e.clientY}px)
      translateX(20px)
    `;
    updateCursorImage();
  };
  const updateCursorImage = () => {
    const cursorEl = fakeCursorRef.current;
    if (!cursorEl) {
      return;
    }
    const flowerPath = getFlowerPath({
      species: flowerSpecies,
      genes: flowerGenes,
    });

    let bgProp = '';
    if (isBlocking === Blockers.LILYOFTHEVALLEY) {
      bgProp = `url(${SuzuranImage})`;
      cursorEl.style.backgroundSize = '75% auto';
    } else if (isBlocking === Blockers.PAVEMENT) {
      bgProp = `url(${RoadTexture})`;
      cursorEl.style.backgroundSize = '75% auto';
    } else if (isBlocking === Blockers.CLIFF || isBlocking === Blockers.CLIFF_INVERT) {
      bgProp = `url(${ScoopIcon})`;
      cursorEl.style.backgroundSize = '75% auto';
    } else {
      bgProp = `url(${flowerPath})`;
    }
    if (cursorEl.style.backgroundImage !== bgProp) {
      cursorEl.style.backgroundImage = bgProp;
    }
  };

  return <MainContainer
    onKeyPress={fieldElKeypressHandler}
    tabIndex={1}
    onMouseMove={updateCursor}
    onTouchStart={() => {
      setIsTouchScreen(true);
    }}
  >
    {!isTouchScreen && <FakeCursor
      ref={fakeCursorRef}
    />}
    <Tools>
      <img
        alt={'Set lily of the valley'}
        title={'Set lily of the valley'}
        style={{
          width: 48,
          background: isBlocking === Blockers.LILYOFTHEVALLEY ? 'rgba(255, 255, 255, 0.5)' : '',
        }}
        src={SuzuranWhiteImage}
        onClick={() => {
          setIsBlocking(isBlocking === Blockers.LILYOFTHEVALLEY ? undefined : Blockers.LILYOFTHEVALLEY);
        }}
      />
      <img
        alt={'Set pavement'}
        title={'Set pavement'}
        style={{
          width: 48,
          background: isBlocking === Blockers.PAVEMENT ? 'rgba(255, 255, 255, 0.5)' : '',
        }}
        src={ClothIcon}
        onClick={() => {
          setIsBlocking(isBlocking === Blockers.PAVEMENT ? undefined : Blockers.PAVEMENT);
        }}
      />
      <img
        alt={'Clear field'}
        title={'Clear field'}
        style={{ width: 48 }}
        src={TrashIcon}
        onClick={() => {
          setField({});
          setBlockField({});
          setElevation({});
        }}
      />
      <MinusPlusButton
        title={'Shrink field'}
        onClick={() => {
          setFieldWidth(Math.max(3, fieldWidth - 1));
          setFieldHeight(Math.max(3, fieldHeight - 1));
        }}
      />
      <PlusButton
        title={'Enlarge field'}
        onClick={() => {
          setFieldWidth(Math.min(99, fieldWidth + 1));
          setFieldHeight(Math.min(99, fieldHeight + 1));
        }}
      />
      <img
        alt={'Left click to elevate, right click to lower'}
        title={'Left click to elevate, right click to lower'}
        style={{
          width: 48,
          background: isBlocking === Blockers.CLIFF ? 'rgba(255, 255, 255, 0.5)' : '',
        }}
        src={CliffIcon}
        onClick={() => {
          setIsBlocking(Blockers.CLIFF);
          // setViewPerspective(!viewPerspective);
        }}
      />
      <img
        alt={'Right click to elevate, left click to lower'}
        title={'Right click to elevate, left click to lower'}
        style={{
          width: 48,
          background: isBlocking === Blockers.CLIFF_INVERT ? 'rgba(255, 255, 255, 0.5)' : '',
          transform: 'rotateZ(180deg)',
        }}
        src={CliffIcon}
        onClick={() => {
          setIsBlocking(Blockers.CLIFF_INVERT);
        }}
      />
      <img
        alt={'Show elevation with flat 2D sprite'}
        title={'Show elevation with flat 2D sprite'}
        style={{
          width: 48,
          background: viewBevel ? 'rgba(255, 255, 255, 0.5)' : '',
        }}
        src={CliffFloorWall}
        onClick={() => {
          setViewBevel(!viewBevel);
        }}
      />
    </Tools>
    <Tools>
      <FlowerSpeciesChoice>
        {flowerOptions.map(f => {
          return <FlowerSpeciesOption
            key={f}
            onClick={() => {
              setFlowerSpecies(f);
              setIsBlocking(undefined);
            }}
            active={!isBlocking && f === flowerSpecies}
          >
            <FlowerIcon
              flower={{
                species: f,
                genes: '',
              }}
            />
          </FlowerSpeciesOption>;
        })}
      </FlowerSpeciesChoice>
      <FlowerColorChoice>
        {Object.entries(colorOptions).map(colorItem => {
          return <FlowerSpeciesOption
            key={`${flowerSpecies}${colorItem[0]}`}
            onClick={() => {
              setFlowerGenes(colorItem[1]);
              setIsBlocking(undefined);
            }}
            active={!isBlocking && colorItem[0] === currentColor}
          >
            <FlowerIcon
              flower={{
                species: flowerSpecies,
                genes: colorItem[1],
              }}
            />
          </FlowerSpeciesOption>;
        })}
      </FlowerColorChoice>
    </Tools>
    <FieldEl
      style={{
        width: `${(cellSize + thisBevelWidth) * fieldWidth}px`,
      }}
      isViewPerspective={viewPerspective}
      isViewBevel={viewBevel}
    >
      {rows.map((row, rowIndex) => {
        return <Row key={rowIndex} isBevelled={viewBevel}>
          {row.map((_, colIndex) => {
            const content = field[rowIndex]?.[colIndex];
            const blockerType = blockField[rowIndex]?.[colIndex];
            const cellElevation = elevation[rowIndex]?.[colIndex] || 0;
            const bevels = viewBevel ? [
              cellElevation > (elevation[rowIndex - 1]?.[colIndex] || 0),
              cellElevation > (elevation[rowIndex]?.[colIndex + 1] || 0),
              cellElevation > (elevation[rowIndex + 1]?.[colIndex] || 0),
              cellElevation > (elevation[rowIndex]?.[colIndex - 1] || 0),
              (
                cellElevation > (elevation[rowIndex]?.[colIndex - 1] || 0)
                && cellElevation > (elevation[rowIndex - 1]?.[colIndex - 1] || 0)
                && cellElevation > (elevation[rowIndex - 1]?.[colIndex] || 0)
              ),
              (
                cellElevation > (elevation[rowIndex]?.[colIndex + 1] || 0)
                && cellElevation > (elevation[rowIndex - 1]?.[colIndex + 1] || 0)
                && cellElevation > (elevation[rowIndex - 1]?.[colIndex] || 0)
              ),
              (
                cellElevation > (elevation[rowIndex]?.[colIndex - 1] || 0)
                && cellElevation > (elevation[rowIndex + 1]?.[colIndex - 1] || 0)
                && cellElevation > (elevation[rowIndex + 1]?.[colIndex] || 0)
              ),
              (
                cellElevation > (elevation[rowIndex]?.[colIndex + 1] || 0)
                && cellElevation > (elevation[rowIndex + 1]?.[colIndex + 1] || 0)
                && cellElevation > (elevation[rowIndex + 1]?.[colIndex] || 0)
              ),
              (
                cellElevation > (elevation[rowIndex - 1]?.[colIndex] || 0)
                && cellElevation === (elevation[rowIndex - 1]?.[colIndex + 1] || 0)
              ),
              (
                cellElevation > (elevation[rowIndex - 1]?.[colIndex] || 0)
                && cellElevation === (elevation[rowIndex - 1]?.[colIndex - 1] || 0)
              ),
              (
                cellElevation > (elevation[rowIndex]?.[colIndex + 1] || 0)
                && cellElevation === (elevation[rowIndex - 1]?.[colIndex + 1] || 0)
              ),
              (
                cellElevation > (elevation[rowIndex]?.[colIndex - 1] || 0)
                && cellElevation === (elevation[rowIndex - 1]?.[colIndex - 1] || 0)
              ),
            ] : [];
            return <Cell
              key={colIndex}
              onClick={onClickCell(rowIndex, colIndex)}
              onContextMenu={onClickCell(rowIndex, colIndex, true)}
              onMouseOver={() => {
                // setHoverCol(colIndex);
                // setHoverRow(rowIndex);
              }}
              style={viewBevel ? {
                zIndex: cellElevation + 1,
              } : {
                transform: `translateZ(${25 * (cellElevation)}px)`,
              }}
              elevation={cellElevation}
              isBevelled={viewBevel}
            >
              {bevels.map((b, i) => {
                if (!b) {
                  return null;
                }
                return <Bevel
                  key={i}
                  index={i}
                />;
              })}
              {!blockerType && content && <FlowerIcon
                flower={content}
              />}
              {blockerType === Blockers.PAVEMENT && <BlockImage
                src={RoadTexture}
              />}
              {blockerType === Blockers.LILYOFTHEVALLEY && <BlockImage
                src={SuzuranImage}
              />}
            </Cell>;
          })}
        </Row>;
      })}
    </FieldEl>
  </MainContainer>;
};

interface FlowerIconProps {
  flower: Flower
}

export const FlowerIcon = (props: FlowerIconProps) => {
  const path = getFlowerPath(props.flower);
  return <div>
    <FlowerImg src={path}/>
  </div>;
}; 

const getFlowerPath = (flower: Flower) => {
  const set = FlowerIconPaths[flower.species];
  const color = resolveFlowerColor(flower);
  return set[color] || Object.values(set)[0];
};

export const resolveFlowerColor = (flower: Flower) => {
  const geneSet = Genes[flower.species];
  const gene =  flower.species === FlowerNames.rose ? flower.genes : flower.genes.slice(-8);
  return geneSet[gene];
};

const MainContainer = styled.div`
  margin: 8px 0;
  perspective: 1000px;
  position: relative;

  &:focus {
    outline: none;
  }
`;

const FakeCursor = styled.div`
  border-radius: 4px;
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  z-index: 5;
  background-size: 100% 100%;
  opacity: 0.8;
  background-repeat: no-repeat;
`;

interface FlowerSpeciesOptionProps {
  active?: boolean
}
const FlowerSpeciesOption = styled.div<FlowerSpeciesOptionProps>`
  cursor: pointer;
  transition: transform 0.1s;
  border-radius: 4px;

  &:hover {
    transform: scale(1.1);
  }
  ${({ active }) => active && css`
    background: rgba(255, 255, 255, 0.3);
  `}
`;

const FlowerSpeciesChoice = styled.div`
  margin-bottom: 12px;
  > div {
    display: inline-block;
    width: 60px;
  }
`;

const FlowerColorChoice = styled.div`
  margin-bottom: 12px;
  > div {
    display: inline-block;
    width: 30px;
  }
`;

const Tools = styled.div`
  text-align: center;
  user-select: none;
  margin: 12px 0;

  > img {
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      transform: scale(1.1);
    }

    &:active {
      transform: translateY(1px) scale(1.1);
    }
  }
`;

const FlowerImg = styled.img`
  width: 100%;
`;

const slamIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(10);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;
const BlockImage = styled.img`
  width: 100%;
  height: 100%;
  border: solid 6px transparent;
  box-sizing: border-box;
  border-radius: 12px;
  animation: ${slamIn} 0.1s 1 linear;
`;

const bounceIn = keyframes`
  0% {
    transform: scale(0);
  }

  80% {
    transform: scale(2);
  }
  100% {
    transform: scale(1);
  }
`;

interface CellProps {
  elevation: number;
  isBevelled?: boolean;
}
const Cell = styled.div<CellProps>`
  display: inline-block;
  width: ${cellSize}px;
  height: ${cellSize}px;
  background: 
    ${({ isBevelled }) => !isBevelled && `
      linear-gradient(to left, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.25)),
      url('${GrassTexture}')
    `};
  vertical-align: top;
  cursor: pointer;
  transition: transform 0.1s, background-size 0.1s;
  background-position: center center;
  background-repeat: no-repeat;
  box-sizing: border-box;
  position: relative;
  border: solid 0.5px rgba(0, 0, 0, 0.2);

  ${({ elevation, isBevelled }) => css`
    ${elevation === 1 && css`
      background: 
        linear-gradient(to left, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1))
        ${!isBevelled && `, url('${GrassTexture}')`};
    `}
    ${elevation === 2 && css`
      background: 
        linear-gradient(to left, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25))
        ${!isBevelled && `, url('${GrassTexture}')`};
    `}
  `}
  background-size: 100% 100%;

  ${({ isBevelled }) => isBevelled && css`
    margin: ${bevelWidth / 2}px;
  `}

  &:hover {
  }

  ${FlowerImg} {
    animation: ${bounceIn} 0.1s 1;
  }

  > div {
    transition: transform 1s;
    transform-origin: bottom;
    pointer-events: none;
  }
`;

interface FieldElProps {
  isViewPerspective: boolean;
  isViewBevel: boolean;
}
const FieldEl = styled.div<FieldElProps>`
  margin: 0 auto;
  border-radius: 8px;
  user-select: none;
  background:
    ${({ isViewBevel }) => isViewBevel && `
      linear-gradient(to left, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.25)),
    `}
    url('${GrassTexture}');
  background-size: ${cellSize}px ${cellSize}px;
  transition: transform 2s;
  transform-style: preserve-3d;

  &:hover {
    ${Cell} {
    }
  }

  ${({ isViewBevel }) => isViewBevel && css`
    padding: ${bevelWidth / 2}px;
  `}
  ${({ isViewPerspective }) => isViewPerspective && css`
    transform: rotateX(55deg) rotateZ(55deg);
    ${Cell} {
      border: solid 0.5px rgba(0, 0, 0, 0.2);
      > div {
        ${''/*transform: translateY(-50%) rotateX(-90deg);*/}
      }
    }

    &:hover {
      ${Cell} {
        border: solid 0.5px rgba(0, 0, 0, 0.4);
      }
    }
  `}
`;

interface RowProps {
  isBevelled?: boolean;
}
const Row = styled.div<RowProps>`
  display: block;
  height: ${cellSize}px;
  ${({ isBevelled }) => isBevelled ? css`
    height: ${cellSize + bevelWidth}px;
  ` : css`
    transform-style: preserve-3d;
  `}
`;

export const MinusPlusButton = styled.div`
  width: 48px;
  height: 48px;
  display: inline-block;
  cursor: pointer;
  border-radius: 4px;
  position: relative;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: translateY(1px) scale(1.1);
  }

  &::before, &::after {
    display: block;
    position: absolute;
    width: 24px;
    height: 8px;
    background: #fff;
    top: 50%;
    left: 50%;
  }
  &::before {
    content: '';
    transform: translateX(-50%) translateY(-50%);
  }
`;

interface BevelProps {
  index: number;
}
const bevelSize = 10;
const Bevel = styled.div<BevelProps>`
  position: absolute;
  pointer-events: none;

  ${({ index }) => index % 2 === 0 ? css`
    width: ${cellSize}px;
    height: ${bevelSize}px;
  ` : css`
    width: ${bevelSize}px;
    height: ${cellSize}px;
  `}

  ${({ index }) => index === 0 && css`
    bottom: 100%;
    background-image: url('${CliffSpriteTop}');
    background-size: auto 100%;
  `}
  ${({ index }) => index === 1 && css`
    left: 100%;
    background-image: url('${CliffSpriteRight}');
    background-size: 100% auto;
    margin-left: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 2 && css`
    top: 100%;
    background-image: url('${CliffSpriteBottom}');
    background-size: auto 100%;
    height: ${bevelSize * 2}px;
    margin-top: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 3 && css`
    right: 100%;
    background-image: url('${CliffSpriteLeft}');
    background-size: 100% auto;
    margin-right: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 4 && css`
    right: 100%;
    bottom: 100%;
    background-image: url('${CliffSpriteTopLeft}');
    background-size: 100% auto;
    width: ${bevelSize}px;
    height: ${bevelSize}px;
    margin-right: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 5 && css`
    left: 100%;
    bottom: 100%;
    background-image: url('${CliffSpriteTopRight}');
    background-size: 100% auto;
    width: ${bevelSize}px;
    height: ${bevelSize}px;
    margin-left: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 6 && css`
    right: 100%;
    top: 100%;
    background-image: url('${CliffSpriteBottomLeft}');
    background-size: 100% auto;
    width: ${bevelSize}px;
    height: ${2 * bevelSize}px;
    margin-top: ${-bevelSize/2}px;
    margin-right: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 7 && css`
    left: 100%;
    top: 100%;
    background-image: url('${CliffSpriteBottomRight}');
    background-size: 100% auto;
    width: ${bevelSize}px;
    height: ${2 * bevelSize}px;
    margin-left: ${-bevelSize/2}px;
    margin-top: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 8 && css`
    right: 0;
    bottom: 100%;
    background-image: url('${CliffSpriteInsetTopRight}');
    background-size: 100% auto;
    width: ${bevelSize}px;
    height: ${bevelSize}px;
    margin-right: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 9 && css`
    left: 0;
    bottom: 100%;
    background-image: url('${CliffSpriteInsetTopLeft}');
    background-size: 100% auto;
    width: ${bevelSize}px;
    height: ${bevelSize}px;
    margin-left: ${-bevelSize/2}px;
  `}
  ${({ index }) => index === 10 && css`
    left: 100%;
    top: 0;
    background-image: url('${CliffSpriteInsetBottomLeft}');
    background-size: 100% auto;
    width: ${bevelSize}px;
    height: ${2 * bevelSize}px;
    margin-left: ${-bevelSize/2}px;
    margin-top: ${-bevelSize/2 - 1}px;
  `}
  ${({ index }) => index === 11 && css`
    right: 100%;
    top: 0;
    background-image: url('${CliffSpriteInsetBottomRight}');
    background-size: 100% auto;
    width: ${bevelSize}px;
    height: ${2 * bevelSize}px;
    margin-right: ${-bevelSize/2}px;
    margin-top: ${-bevelSize/2 - 1}px;
  `}
`;

export const PlusButton = styled(MinusPlusButton)`
  &::after {
    content: '';
    transform: translateX(-50%) translateY(-50%) rotateZ(90deg);
  }
`;

export default FieldMaker;
