import React, { Component } from "react";

import "./posey.css";
import Game from "./Game";

class Posey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameStarted: false
    };
    this.startGame = this.startGame.bind(this);
  }

  startGame() {
    this.setState({ gameStarted: true });
  }

  render() {
    return (
      <div>
        <h1>Posey</h1>
        {!this.state.gameStarted && (
          <button onClick={this.startGame}>Start</button>
        )}
        {this.state.gameStarted && <Game />}
      </div>
    );
  }
}

export default Posey;
