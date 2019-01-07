class CJCore extends React.Component {
	constructor(props) {
		super(props);
		this.state = { data: [], index: 0, isHidden: false, counter: 0, score: 0, time: new Date(), judgeID: 0, winList: [], topPick: "" }; 
		this.nextFileButton = this.nextFileButton.bind(this);
		this.prevFileButton = this.prevFileButton.bind(this);
		this.judgePairOneButton = this.judgePairOneButton.bind(this);
		this.judgePairTwoButton = this.judgePairTwoButton.bind(this);
		this.judgePair = this.judgePair.bind(this);
		this.send = this.send.bind(this);
		this.judgeScore = this.judgeScore.bind(this);
		this.getNextFiles = this.getNextFiles.bind(this);
		this.getJudgeID = this.getJudgeID.bind(this);
		this.getLeadingScript = this.getLeadingScript.bind(this);
	}

	componentDidMount() {
		const xhr = new XMLHttpRequest();
		xhr.open('get', this.props.url, true);
		xhr.onload = () => {
			const data = JSON.parse(xhr.responseText);
			this.setState({ data: data });
		};
		xhr.send();
		//This is placed here for the momennt so that the judge ID is not generated more than once, still needs more work.
		//Need to also explore what happens in the case of multiple instances of this running.
		this.getJudgeID();
	}

	toggleHidden() {
		this.setState({ isHidden: !this.state.isHidden });
		}

	getNextFiles() {
		var newindex = this.state.index + 1;
		var newcounter = this.state.counter;
		this.state.index === this.state.counter ? newcounter++ : newcounter;
		var Score = this.judgeScore();
	    this.getLeadingScript();
		this.setState({ index: newindex, counter: newcounter, score: Score, time: new Date()});
	}

	nextFileButton() {
		if (this.state.index < this.state.counter) {
			this.getNextFiles();
		}
	}

	prevFileButton() {
		var newindex = this.state.index - 1;
		if (newindex <= 0) {
			newindex = 0;
		}
		this.setState({ index: newindex});
	}

	judgePairOneButton() {
		this.judgePair("item1");
	}

	judgePairTwoButton() {
		this.judgePair("item2");
	}

	//This handles pressing either the item 1 or 2 button 
	judgePair(itemNumber) {
		var item = this.state.data[this.state.index][itemNumber];
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
		var elapsed = seconds + " seconds";
		return elapsed;
	}

	judgeScore(score) {
		score = this.state.score;
		score +=2;
		return score;
	}

	getJudgeID() {
		const xhr = new XMLHttpRequest();
		xhr.open('get', "/id", true);
		xhr.onload = () => {
			const id = JSON.parse(xhr.responseText);
			this.setState({ judgeID: id });
		};
		xhr.send();
		var id = this.state.judgeID;
		return id;
	}

	getLeadingScript() {
		const xhr = new XMLHttpRequest();
		xhr.open('get', "/leader", true);
		xhr.onload = () => {
			const script = xhr.responseText; 
			this.setState({ topPick: script });
		};
		xhr.send();
		var script = this.state.topPick;
		return script;
	}

	send(pair, winner, timeJ, elapsed) {
		fetch("winners", {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ winner: winner, pairOfScripts: pair, timeJudgement: timeJ, elapsedTime: elapsed, judgeID: this.state.judgeID })
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
		let viewLeft;
		let viewRight;
		var endOfPairs = this.state.counter;
		
		if (this.state.data.length > 0) {
			if (endOfPairs >= this.state.data.length) {
				viewLeft = <EndOfPairs align="left" />;
			} else {
				var currentFileLeft = this.state.data[this.state.index]["item1"];
				var currentFileRight = this.state.data[this.state.index]["item2"];
				var x = getFileType(currentFileLeft);
				var y = getFileType(currentFileRight);
				if (x === true) {
					viewLeft = <PDFViewer id="left" data={currentFileLeft} />;

				} else {
					viewLeft = <IMGViewer id="left" data={currentFileLeft} />;
				}
				if (y === true) {
					viewRight = <PDFViewer id="right" data={currentFileRight} />;
				} else {

					viewRight = <IMGViewer id="right" data={currentFileRight} />;
				}
			}
		}
		return (
			<div>
				{<Header isHidden={this.state.isHidden} />}
				<div class="itemDisplay">
					<button id="prevFileButton" class="btn btn-dark" align="right" onClick={this.prevFileButton}>Previous File</button>
					{viewLeft}
					{viewRight}
					<button id="nextFileButton" class="btn btn-dark" align="left" onClick={this.nextFileButton}>Next File</button>
				</div>

				<div class="judgeChoice">
					<button id="itemOne" class="btn btn-dark" onClick={this.judgePairOneButton}>Item One</button>
					<button id="itemTwo" class="btn btn-dark" onClick={this.judgePairTwoButton}>Item Two</button>
				</div>
				<button id="hideTitle" class="btn btn-dark" onClick={this.toggleHidden.bind(this)} >
					Hide Title
				</button>
				<TotalScripts data={this.state.data.length} score={this.state.score} top={this.state.topPick} />
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
			<p>Scripts Judged: {props.score}</p>
			<p>Leading Script: {props.top}</p>
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
	<CJCore url="/files"/>,
	document.getElementById('pdfLoc')
);
