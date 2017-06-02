import Expo from 'expo';
import React from 'react';
import {
  Alert,
  Dimensions,
  PanResponder,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import * as Meshes from '../utilities/scene';
import Assets from '../Assets';

// Can't use `import ...` form because THREE uses oldskool module stuff.
const THREE = require('three');

// `THREEView` wraps a `GLView` and creates a THREE renderer that uses
// that `GLView`. The class needs to be constructed with a factory so that
// the `THREE` module can be injected without expo-sdk depending on the
// `'three'` npm package.
const THREEView = Expo.createTHREEViewClass(THREE);

//// Game

// Render the game as a `View` component.

export default class Game extends React.Component {
  state = {
    scoreCount: 0,
    started: false,
  };

  componentWillMount() {
    //// Camera

    // An orthographic projection from 3d to 2d can be viewed as simply dropping
    // one of the 3d dimensions (say 'Z'), after some rotation and scaling. The
    // scaling here is specified by the width and height of the camera's view,
    // which ends up defining the boundaries of the viewport through which the
    // 2d world is visualized.
    //
    // Let `p`, `q` be two distinct points that are sent to the same point in 2d
    // space. The direction of `p - q` (henceforth 'Z') then serves simply to
    // specify depth (ordering of overlap) between the 2d elements of this world.
    //
    // The width of the view will be 4 world-space units. The height is set based
    // on the phone screen's aspect ratio.
    this.width = 4;
    const { width: screenWidth, height: screenHeight } = Dimensions.get(
      'window'
    );
    this.height = screenHeight / screenWidth * this.width;
    this.camera = new THREE.OrthographicCamera(
      -this.width / 2,
      this.width / 2,
      this.height / 2,
      -this.height / 2,
      1,
      10000
    );
    this.camera.position.z = 1000;
    this.animatingIds = [];
    this.scene = new THREE.Scene();
    this.createGameScene();
  }

  //// Scene
  // Creates a new scene for the game, ready to play
  createGameScene = () => {
    this.setState({ started: false, scoreCount: 0 });
    this.animatingIds = [];
    this.velocity = -1;
    this.planeMesh = Meshes.createPlane(THREEView);
    this.startScreen = Meshes.createStart(THREEView);
    this.background = Meshes.createBackground(this.width, this.height);
    this.scene.add(this.startScreen);
    this.scene.add(this.planeMesh);
    this.scene.add(this.background);
  };

  // Resets the game back to the original state with the start menu
  resetScene = () => {
    clearInterval(this.pillarInterval);
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.createGameScene();
  };

  // Starts the game when user touches to start
  startGame = () => {
    this.setState({ started: true });
    this.createSetOfPillars();
    this.pillarInterval = setInterval(() => {
      this.createSetOfPillars();
    }, 3000);
    this.scene.remove(this.startScreen);
  };
  //// Events

  // Creates a new set of pillars with random height, adds them to the scene
  createSetOfPillars = () => {
    const pillarTop = Meshes.createPillar(THREEView);
    const pillarBottom = Meshes.createPillar(THREEView);
    const rand = 4 - Math.random() * 2;
    pillarTop.position.y = rand;
    pillarBottom.position.y = rand - 7.3;
    pillarTop.name = 'top';
    pillarBottom.name = 'bottom';
    pillarTop.passed = false;
    pillarBottom.passed = false;
    this.scene.add(pillarTop);
    this.scene.add(pillarBottom);
    this.animatingIds.push(pillarTop.id);
    this.animatingIds.push(pillarBottom.id);
  };

  // Moves to pillar toward the left. Also handles collisions with plane
  animatePillar = (id, dt) => {
    const object = this.scene.getObjectById(id);
    if (!object) {
      return;
    }

    // Checks if plane passes pillar to increment score
    if (
      Math.round(object.position.x, -5) == 0 &&
      !object.passed &&
      object.name == 'top'
    ) {
      this.setState({ scoreCount: this.state.scoreCount + 1 });
      object.passed = true;
    }

    // Checks for collision of pillar and plane
    if (this.intersects(object, this.planeMesh)) {
      alert('You Lost!');
      this.resetScene();
    } else if (object.position.x < -2.5) {
      // If pillar is off the screen, remove from scene
      this.animatingIds.splice(this.animatingIds.indexOf(id), 1);
      this.scene.remove(object);
    } else {
      // Move pillar to the left
      object.position.x -= 0.02;
    }
  };

  // Check if two objects are intersecting in any axis
  intersects = (target, candidate) => {
    const a = new THREE.Box3().setFromObject(target);
    const b = new THREE.Box3().setFromObject(candidate);

    return a.intersectsBox(b);
  };

  //// Events
  // This function is called every frame, with `dt` being the time in seconds
  // elapsed since the last call.
  tick = dt => {
    if (this.state.started) {
      if (
        this.planeMesh.position.y < this.height / 2 * -1 ||
        this.planeMesh.position.y > this.height / 2
      ) {
        alert('You Lost!');
        this.resetScene();
      } else {
        this.velocity -= 7 * dt;
        this.planeMesh.translateY(this.velocity * dt);

        this.animatingIds.forEach(id => {
          this.animatePillar(id, dt);
        });
      }
    }
  };

  // These functions are called on touch and release of the view respectively.
  touch = (_, gesture) => {
    if (this.state.started) {
      // Increase velocity to make plane go up
      this.velocity = 4;
    } else {
      this.startGame();
    }
  };

  //// React component

  // We bind our `touch` and `release` callbacks using a `PanResponder`. The
  // `THREEView` takes our `scene` and `camera` and renders them every frame.
  // It also takes our `tick` callbacks and calls it every frame.
  panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: this.touch,
    onShouldBlockNativeResponder: () => false,
  });

  render() {
    return (
      <View style={{ flex: 1 }}>
        <THREEView
          {...this.viewProps}
          {...this.panResponder.panHandlers}
          scene={this.scene}
          camera={this.camera}
          tick={this.tick}
          style={{ flex: 1 }}
        />
        {this.state.started ? <Score score={this.state.scoreCount} /> : null}
      </View>
    );
  }
}

class Score extends React.Component {
  render() {
    return (
      <Text style={styles.scoreText}>
        {this.props.score}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  scoreText: {
    position: 'absolute',
    top: 40,
    width: 75,
    left: 0,
    textAlign: 'center',
    zIndex: 100,
    backgroundColor: 'transparent',
    color: 'white',
    fontSize: 30,
  },
});
