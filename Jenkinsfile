pipeline {
    agent none

    environment {
        DOCKER_IMAGE = 'arunthopil/pro-green-v2'
        SONARQUBE_TOKEN = credentials('sonar-docker')
        DOCKERHUB_CREDENTIALS = credentials('Dockerhub')
        // SSH credentials for each environment
        DEMO_SSH_CREDENTIALS = credentials('ssh-wsl') 
        TEST_SSH_CREDENTIALS = credentials('test-ssh-credentials-id')
        STAGE_SSH_CREDENTIALS = credentials('stage-ssh-credentials-id')
        PROD_SSH_CREDENTIALS = credentials('prod-ssh-credentials-id')
        // Docker Hosts setup
        DEMO_DOCKER_HOST = 'ssh://host.docker.internal' 
        TEST_DOCKER_HOST = 'ssh://test-user@test-docker-host'
        STAGE_DOCKER_HOST = 'ssh://stage-user@stage-docker-host'
        PROD_DOCKER_HOST = 'ssh://prod-user@prod-docker-host'
    }

    stages {
        stage('Setup') {
            agent any
            steps {
                script {
                    ENVIRONMENT = BRANCH_NAME == 'main' ? 'Demo' :
                                  BRANCH_NAME == 'production' ? 'Production' :
                                  BRANCH_NAME == 'staging' ? 'Staging' :
                                  BRANCH_NAME.startsWith('test') ? 'Testing' : 'De'
                    echo "Environment set to ${ENVIRONMENT}"
                }
            }
        }

        stage('Checkout Code') {
            agent any
            steps {
                checkout scm
            }
        }
        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }
        stage('Use Artifacts') {
            steps {
                script {
                    if (currentBuild.previousBuild != null && currentBuild.previousBuild.result == 'SUCCESS') {
                        copyArtifacts(projectName: "${JOB_NAME}", selector: lastSuccessful(), filter: 'lint-results.txt');
                    } else {
                        echo "No previous successful build found. Skipping artifact copy."
                    }
                }                        
                // Use lint-results.txt as needed
            }
        }
        stage('Prepare and Build') {
            agent { 
                docker { 
                    image 'node:21' 
                    } 
                }

            steps {
                dir('client') {
                    sh 'rm -rf node_modules/'
                    sh 'npm install'
                    sh 'npm run build'
                    stash includes: '**', name: 'build-artifacts'
                }
            }
        }

        stage('Analyze and Scan') {
            agent any
            steps {
                script {
                    unstash 'build-artifacts'
                    dir('client') {
                        withSonarQubeEnv('Sonarcube-cred') {
                            sh "sonar-scanner -Dsonar.projectKey=my-project -Dsonar.sources=. -Dsonar.host.url=https://sonarqube.globalgreeninit.world -Dsonar.login=${env.SONARQUBE_TOKEN}"
                        }
                        // Snyk scan (corrected placement and syntax)
                        //withCredentials([string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')]) {
                            snykSecurity failOnError: false, failOnIssues: false, organisation: 'Group2-Global-Green', projectName: 'For-Green2', snykInstallation: 'Snyk', snykTokenId: 'snyk-token', targetFile: '/client/package.json'
                        }
                    }
                }
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'Dockerhub', variable: 'Dockerhub')]) {
                    sh 'docker login -u arunthopil' -p $Dockerhub
                    }
                    def appImage = docker.build('${DOCKER_IMAGE}:${ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}')
                    appImage.push()
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def dockerHost = ''
                    def sshCredentialsId = ''
                    switch (ENVIRONMENT) {
                        case 'Demo':
                            dockerHost = DEMO_DOCKER_HOST
                            sshCredentialsId = DEMO_SSH_CREDENTIALS
                            break
                    //Commented out until these environments for now
                        //case 'Staging':
                            //dockerHost = STAGE_DOCKER_HOST
                            //sshCredentialsId = STAGE_SSH_CREDENTIALS
                           // break
                        //case 'Production':
                          //  dockerHost = PROD_DOCKER_HOST
                          //  sshCredentialsId = PROD_SSH_CREDENTIALS
                          //  break
                        //case 'Testing':
                          //  dockerHost = TEST_DOCKER_HOST
                          //  sshCredentialsId = TEST_SSH_CREDENTIALS
                          //  break
                    }

                    if (dockerHost.startsWith('ssh://')) {
                        sshagent([sshCredentialsId]) {
                            sh """
                                ssh -o StrictHostKeyChecking=no ${dockerHost} <<EOF
                                    docker pull ${DOCKER_IMAGE}:${ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}
                                    docker stop ${ENVIRONMENT.toLowerCase()}-app || true
                                    docker rm ${ENVIRONMENT.toLowerCase()}-app || true
                                    docker run -d --name ${ENVIRONMENT.toLowerCase()}-app -p 80:3000 ${DOCKER_IMAGE}:${ENVIRONMENT.toLowerCase()}-${env.BUILD_NUMBER}
                                EOF
                            """
                        }
                    } else {
                        echo "Local deployment logic not specified"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline execution completed for ${ENVIRONMENT}"
        }
    }

