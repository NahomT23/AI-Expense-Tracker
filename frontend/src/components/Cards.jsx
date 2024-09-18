import { useQuery } from "@apollo/client";
import { GET_TRANSACTIONS } from "../graphql/queries/transaction.query";
import { GET_AUTHENTICATED_USER, GET_USER_AND_TRANSACTIONS } from '../graphql/queries/user.query'
import Card from "./Card";

const Cards = () => {
	const { data, loading, error } = useQuery(GET_TRANSACTIONS);
	const {data:authUser} = useQuery(GET_AUTHENTICATED_USER);


	const { data: userAndTransactions} = useQuery(GET_USER_AND_TRANSACTIONS, {
		variables:{
			userId: authUser?.authUser?._id,
		}
	});

	console.log("cards:", data);

	// Determine if there are transactions to display
	const hasTransactions = data?.transactions && data.transactions.length > 0;

	return (
		<div className="w-full px-10 min-h-[40vh]">
			<p className="text-5xl font-bold text-center my-10">History</p>

			{/* Show loading message */}
			{loading && <p className="text-2xl text-center">Loading transactions...</p>}

			{/* Show error message */}
			{error && <p className="text-2xl text-center text-red-500">Error loading transactions.</p>}

			{/* Show transactions */}
			{!loading && hasTransactions && (
				<div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-start mb-20">
					{data.transactions.map((transaction) => (
						<Card key={transaction._id} transaction={transaction}
						authUser={authUser.authUser}
						/>
					))}
				</div>
			)}

			{/* Show "No transaction history found" message */}
			{!loading && !hasTransactions && (
				<p className="text-2xl font-bold text-center w-full">
					No transaction history found
				</p>
			)}
		</div>
	);
};

export default Cards;
