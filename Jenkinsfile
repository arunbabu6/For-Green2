pipeline {
    agent none // Use none to allow different agents in different stages

    environment {
        // Environment-specific variables
        DOCKER_IMAGE = 'arunthopil/pro-green-v2'
        SONARQUBE_TOKEN = credentials('Sonarcube-cred')
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
            // Previous stages (Setup, Checkout Code, Prepare and Build, Analyze and Scan) remain unchanged
            stage('Checkout Code') {
                agent any // Run on any available agent
                    steps {
                      checkout scm
                }
            }
        }

        stage('Prepare and Build') {
            agent {
                docker {
                    image 'node:21'
                    //args '-u root' // Use root user inside the container to avoid permission issues
                }
            }
            steps {
                dir('client') {
                    sh 'npm install'
                    sh 'npm run build'
                }
                stash includes: '**', name: 'build-artifacts'
            }
        }

        stage('Analyze and Scan') {
            steps {
                unstash 'build-artifacts'
                dir('client') {
                    // Add SonarQube analysis 
                    withSonarQubeEnv('Sonarcube') { // 'Sonarcube-cred' from |should match the SonarQube configuration in Jenkins
                         sh """
                        sonar-scanner \
                        -Dsonar.projectKey=my-project \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=https://sonarqube.globalgreeninit.world \
                        -Dsonar.login=$SONARQUBE_TOKEN
                        """ 
                    //and Snyk scan here

                    snykSecurity failOnError: false, failOnIssues: false, organisation: 'Group2-Global-Green', projectName: 'For-Green2', snykInstallation: 'Snyk', snykTokenId: 'snyk-token', targetFile: '/client/package.json'     

                    // Ensure tools are configured to run in this environment
                    echo "Running analysis and security scans"
                }
            }
        }
        }

        stage('Build and Push Docker Image') {
            agent any // Run on any available agent
            steps {
                script {
                    def dockerImage = "${DOCKER_IMAGE}:${BRANCH_NAME}-${env.BUILD_NUMBER}"
                    withCredentials([string(credentialsId: 'Dockerhub', variable: 'DOCKERHUB_PASSWORD')]) {
                        sh 'docker login -u arunthopil -p ${DOCKERHUB_PASSWORD}'
                        sh "docker build -t ${dockerImage} ."
                        sh "docker push ${dockerImage}"
                    }
                }
            }
        }
        stage('Deploy') {
            agent any // Run on any available agent
            steps {
                script {
                    // Determine SSH credentials and Docker host based on environment
                    def sshCredentialsId = ''
                    def dockerHost = ''
                    if (ENVIRONMENT == 'Production') {
                        sshCredentialsId = env.PROD_SSH_CREDENTIALS
                        dockerHost = env.PROD_DOCKER_HOST
                    } else if (ENVIRONMENT == 'Staging') {
                        sshCredentialsId = env.STAGE_SSH_CREDENTIALS
                        dockerHost = env.STAGE_DOCKER_HOST
                    } else if (ENVIRONMENT == 'Testing') {
                        sshCredentialsId = env.TEST_SSH_CREDENTIALS
                        dockerHost = env.TEST_DOCKER_HOST
                    } else if (ENVIRONMENT == 'Demo') {
                        sshCredentialsId = env.DEMO_SSH_CREDENTIALS
                        dockerHost = env.DEMO_DOCKER_HOST
                    }

                    // Deploy using SSH and Docker commands
                    if (!dockerHost.isEmpty() && !sshCredentialsId.isEmpty()) {
                        sshagent([sshCredentialsId]) {
                            def dockerImage = "${DOCKER_IMAGE}:${BRANCH_NAME}-${env.BUILD_NUMBER}"
                            // Commands to pull the Docker image and restart the container
                            sh """
                                ssh -o StrictHostKeyChecking=no ${dockerHost.substring(6)} << EOF
                                    docker pull ${dockerImage}
                                    docker stop ${BRANCH_NAME}-app || true
                                    docker rm ${BRANCH_NAME}-app || true
                                    docker run -d --name ${BRANCH_NAME}-app -p 80:3000 ${dockerImage}
                                EOF
                            """
                        }
                    } else {
                        echo "Deployment environment not configured properly."
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



