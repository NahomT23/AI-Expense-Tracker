import { FaLocationDot } from "react-icons/fa6";
import { BsCardText } from "react-icons/bs";
import { MdOutlinePayments } from "react-icons/md";
import { FaSackDollar } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { HiPencilAlt } from "react-icons/hi";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/formatDate";
import toast from "react-hot-toast";
import { useMutation } from "@apollo/client";
import { DELETE_TRANSACTION } from "../graphql/mutations/transaction.mutation";

const categoryColorMap = {
	budget: "from-green-500 to-green-500", // Lighter green
	expense: "from-pink-800 to-pink-600", // Original pink
	income: "from-blue-500 to-blue-400", // Darker blue
};

const Card = ({ transaction, authUser }) => {
	let { category, amount, location, date, paymentType, description } = transaction;

	// Transform category names
	category = category === "investment" ? "income" : category === "saving" ? "budget" : category;

	// Get the corresponding color class from the map
	const cardClass = categoryColorMap[category] || "from-gray-500 to-gray-500"; // Default color if category not found

	const [deleteTransaction, { loading }] = useMutation(DELETE_TRANSACTION, {
		refetchQueries: ['GetTransactions', 'GetTransactionStatistics']
	});

	description = description[0]?.toUpperCase() + description.slice(1);
	category = category[0]?.toUpperCase() + category.slice(1);
	paymentType = paymentType[0]?.toUpperCase() + paymentType.slice(1);
	location = location[0]?.toUpperCase() + location.slice(1);
	const formatedDate = formatDate(date);

	const handleDelete = async () => {
		try {
			await deleteTransaction({
				variables: {
					transactionId: transaction._id
				}
			});
			toast.success('Transaction deleted successfully');
		} catch (error) {
			toast.error(error.message);
		}
	}

	// Format amount with commas
	function formatAmount(amount) {
		return new Intl.NumberFormat().format(amount);
	}
	const formattedAmount = formatAmount(amount);

	return (
		<div className={`rounded-md p-4 bg-gradient-to-br ${cardClass}`}>
			<div className='flex flex-col gap-3'>
				<div className='flex flex-row items-center justify-between'>
					<h2 className='text-lg font-bold text-white'>{category}</h2>
					<div className='flex items-center gap-2'>
						<FaTrash className={"cursor-pointer"} onClick={handleDelete} />
						{loading && <div className="w-6 h-6 border-t-2 mx-2 rounded-full animate-spin"></div>}
						<Link to={`/transaction/${transaction._id}`}>
							<HiPencilAlt className='cursor-pointer' size={20} />
						</Link>
					</div>
				</div>
				<p className='text-white flex items-center gap-1'>
					<BsCardText />
					Description: {description}
				</p>
				<p className='text-white flex items-center gap-1'>
					<MdOutlinePayments />
					Payment Type: {paymentType}
				</p>
				<p className='text-white flex items-center gap-1'>
					<FaSackDollar />
					Amount: ${formattedAmount}
				</p>
				<p className='text-white flex items-center gap-1'>
					<FaLocationDot />
					Location: {location || 'N/A'}
				</p>
				<div className='flex justify-between items-center'>
					<p className='text-xs text-black font-bold'>{formatedDate}</p>
					<img
						src={authUser?.profilePicture}
						className='h-8 w-8 border rounded-full'
						alt=''
					/>
				</div>
			</div>
		</div>
	);
};

export default Card;
