// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AcademicTranscriptRegistry {
    address public admin;

    struct Transcript {
        address issuedBy;
        uint256 issuedAt;
        string ipfsHash; // Link to off-chain transcript
        bool isVerified;
    }

    // Mapping of student => transcript ID => Transcript
    mapping(address => mapping(uint256 => Transcript)) public transcripts;
    // Count of transcripts per student
    mapping(address => uint256) public transcriptCount;
    // Registered institutions
    mapping(address => bool) public isInstitution;

    event InstitutionRegistered(address institution);
    event TranscriptIssued(address indexed student, address indexed institution, string ipfsHash, uint256 indexed transcriptId);
    event TranscriptVerified(address indexed student, uint256 indexed transcriptId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyInstitution() {
        require(isInstitution[msg.sender], "Not a registered institution");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Admin adds a verified institution
    function registerInstitution(address institution) external onlyAdmin {
        require(institution != address(0), "Invalid address");
        isInstitution[institution] = true;
        emit InstitutionRegistered(institution);
    }

    // Institution issues transcript to a student
    function issueTranscript(address student, string calldata ipfsHash) external onlyInstitution {
        require(student != address(0), "Invalid student address");

        uint256 newId = transcriptCount[student]++;
        transcripts[student][newId] = Transcript({
            issuedBy: msg.sender,
            issuedAt: block.timestamp,
            ipfsHash: ipfsHash,
            isVerified: true
        });

        emit TranscriptIssued(student, msg.sender, ipfsHash, newId);
        emit TranscriptVerified(student, newId);
    }

    // View transcript metadata
    function getTranscript(address student, uint256 transcriptId)
        external
        view
        returns (address issuedBy, uint256 issuedAt, string memory ipfsHash, bool isVerified)
    {
        Transcript memory t = transcripts[student][transcriptId];
        return (t.issuedBy, t.issuedAt, t.ipfsHash, t.isVerified);
    }

    // Admin can revoke institution
    function revokeInstitution(address institution) external onlyAdmin {
        isInstitution[institution] = false;
    }
}
