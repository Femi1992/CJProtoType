class CJCore extends React.Component {
	constructor(props) {
		super(props);
		this.state = { data: [], index: 0, isHidden: false, counter: 0 }; 
		this.nextFileButton = this.nextFileButton.bind(this);
		this.prevFileButton = this.prevFileButton.bind(this);
		this.judgePairOneButton = this.judgePairOneButton.bind(this);
		this.judgePairTwoButton = this.judgePairTwoButton.bind(this);
		this.send = this.send.bind(this);
		this.judgeScore = this.judgeScore.bind(this);
		this.getNextFiles = this.getNextFiles.bind(this);
	}

	componentDidMount() {
		const xhr = new XMLHttpRequest();
		xhr.open('get', this.props.url, true);
		xhr.onload = () => {
			const data = JSON.parse(xhr.responseText);
			this.setState({ data: data });
		};
		xhr.send();
	}

	toggleHidden() {
		this.setState({ isHidden: !this.state.isHidden})
		}

	getNextFiles() {
		var len = this.state.data.length;
		var newindex = this.state.index + 1;
		var newcounter = this.state.counter;
		this.state.index == this.state.counter ? newcounter++ : newcounter;
		var Score = this.judgeScore();
		this.setState({ index: newindex, counter: newcounter, score: Score });
	}

	//This moves onto the next two paired files
	nextFileButton() {
		//the below method call updates the judges score, this needs to be fixed.
		this.getNextFiles();
		var counter = this.state.counter;
		var index = this.state.index;
		//is this statement in the correct place? How do we update state after this condition?
		//
		index < counter ? index++ : index;
		this.setState({ index: index, counter: counter })
	}

	//this method needs work if you are at the beginning of the list of pairings
	prevFileButton() {
		var len = this.state.data.length;
		var newindex = this.state.index - 1;
		
		if (newindex <= len-len) {
			newindex = len;
		}
		this.setState({ index: newindex});
	}

	judgePairOneButton() {
		var item = this.state.data[this.state.index]["item1"];
		var timeJudged = this.setTime();
		var elapsed = this.elapsedTime();
		this.getNextFiles();
		this.send(this.state.data[this.state.index], item, timeJudged, elapsed);
	}

	judgePairTwoButton() {
		var item = this.state.data[this.state.index]["item2"];
		var timeJudged = this.setTime();
		var elapsed = this.elapsedTime();
		this.getNextFiles();
		this.send(this.state.data[this.state.index], item, timeJudged, elapsed);
	}

	setTime() {
		var now = new Date();
		var x = now.toLocaleString();
		return x;
	}

	elapsedTime() {
		var start = this.state.time;
		var end = new Date();
		var timeDiff = end - start;
		timeDiff /= 1000;

		var seconds = Math.round(timeDiff);
		var elapsed = seconds + " seconds"
		return elapsed;
	}

	judgeScore(score) {
		score = this.state.counter;
		score +=2;
		return score;
	}

	send(pair, winner, timeJ, elapsed) {
		fetch("winners", {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ winner: winner, pairOfScripts: pair, timeJudgement: timeJ, elapsedTime: elapsed }),
		}).then(function (response) {
			if (response.status !== 200) {
				console.log('fetch returned not ok' + response.status);
			}

			response.json().then(function (data) {
				console.log('fetch returned ok');
				console.log(data);
			});
		})
			.catch(function (err) {
				console.log(`error: ${err}`);
			});
	}

	render() {
		let view;
		let viewTwo;
		var endOfPairs = this.state.counter;
		
		if (this.state.data.length > 0) {
			if (endOfPairs >= this.state.data.length) {
				view = <EndOfPairs align="left" />
			} else {
				var currentFile = this.state.data[this.state.index]["item1"];
				var currentFileNext = this.state.data[this.state.index]["item2"]
				var x = getFileType(currentFile);
				var y = getFileType(currentFileNext);

				if (y === true) {

					viewTwo = <PDFViewer id="right" data={currentFileNext} />
				} else {

					viewTwo = <IMGViewer id="right" data={currentFileNext}  />
				}

				if (x === true) {
					view = <PDFViewer id="left" data={currentFile} />

				} else {
					view = <IMGViewer id="left" data={currentFile}  />
				}
			}
		}
		return (
			<div>
				{<Header isHidden={this.state.isHidden} />}
				<div class="itemDisplay">
					<button id="prevFileButton" class="btn btn-dark" align="right" onClick={this.prevFileButton}>Previous File</button>
					{view}
					{viewTwo}
					<button id="nextFileButton" class="btn btn-dark" align="left" onClick={this.nextFileButton}>Next File</button>
				</div>

				<div class="judgeChoice">
					<button id="itemOne" class="btn btn-dark" onClick={this.judgePairOneButton}>Item One</button>
					<button id="itemTwo" class="btn btn-dark" onClick={this.judgePairTwoButton}>Item Two</button>
				</div>
				<button id="hideTitle" class="btn btn-dark" onClick={this.toggleHidden.bind(this)} >
					Hide Title
				</button>
				<TotalScripts data={this.state.data.length} score={this.state.score} />
			</div>
		);
	}
}

function Header(props) {
	return (
		<div id="header" >
			{!props.isHidden && <h1 id="headerText" align="center"> CJ ENGINE </h1>}
		</div>
		);
}

function TotalScripts(props) {
	return (
		<div id="totalScripts">
			<p>Total pairings: {props.data}</p>
			<p>Scripts Judged {props.score}:</p>
		</div>
	);
}

function PDFViewer(props) {
	return (
		<div id="pdfOne">
			<iframe id={props.id} src={"/pdfjs-2.0.943-dist/web/viewer.html?file=" + props.data} height='500em' width='500em'> </iframe>
		</div>
	);
}

function IMGViewer(props) {
	return (
		<div id="imgOne">
			<img id={props.id} src={props.data} height='500em' width='500em' ></img>
		</div>
	);
}

function EndOfPairs(props) {
	return (
		<img src="finished.jpg" width='40%' align={props.align}></img>
	);
}

function getFileType(filename) {
	if (filename != undefined) {
		var x = filename.includes("pdf");
	}
	else {
		x = false;
	}
	return x;
}






ReactDOM.render(
	<CJCore url="/files" />,
	document.getElementById('pdfLoc')
);
