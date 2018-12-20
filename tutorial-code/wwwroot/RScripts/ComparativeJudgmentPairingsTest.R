#Test script to generate random pairings for Comparative Judgement Engine

#Input parameters: 
# noOfScripts is the length of the array of files which are to be compared (total number of scripts)
# noOfPairings is the number of pairings the function should return 
#Returns:
# a 2d array of width 2 and length 'noOfPairings' containing index values of files to be compared

generatePairings <- function(noOfScripts, noOfPairings){

  pairings<- matrix(, nrow = noOfPairings, ncol = 2)
  
  for(pairing in 1:noOfPairings){
    left <- -1
    right <- -1
    
    while(left==right){
      left <- sample(0:(noOfScripts-1), 1)
      right <- sample(0:(noOfScripts-1), 1)
    }
    
    pairings[pairing,1] <-  left
    pairings[pairing,2] <-  right
  }
  return (pairings)
}

pairings <- generatePairings(10, 50)
