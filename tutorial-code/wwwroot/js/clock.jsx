//needs to tick every second, currently not working
class Clock extends React.Component {
	constructor(props) {
		super(props);
		this.state = { isHidden: false };
	}

	toggleHidden() {
		this.setState({ isHidden: !this.state.isHidden })
	}

	render() {
		return (
			<div id="hideTime" >
				{!this.state.isHidden && <Tick />}
				<Duration />
				<button class="btn btn-dark" onClick={this.toggleHidden.bind(this)} >
					Hide Time
				</button>
			</div>
		);
	}
}

function Tick() {
	return (
		<div id="time">
			<h2>{new Date().toLocaleTimeString()}</h2>
		</div>
	);
}

function Duration() {
	return (
		<div id="timer">
			<h2>Elapsed Time: {updateClock()}</h2>
		</div>
		);
}

function updateClock() {
	var currDate = new Date();
	var diff = currDate - markDate;
	return (format(diff / 1000));
	
}

function format(seconds) {
	var numhours = parseInt(Math.floor(((seconds % 31536000) % 86400) / 3600), 10);
	var numminutes = parseInt(Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 10);
	var numseconds = parseInt((((seconds % 31536000) % 86400) % 3600) % 60, 10);
	return ((numhours < 10) ? "0" + numhours : numhours)
		+ ":" + ((numminutes < 10) ? "0" + numminutes : numminutes)
		+ ":" + ((numseconds < 10) ? "0" + numseconds : numseconds);
}


function Update() {
	ReactDOM.render(
		<Clock />,
		document.getElementById('root')
	);
}

setInterval(Update, 1000);
var markDate = new Date();
